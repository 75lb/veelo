// module dependencies
var util = require("util"),
    path = require("path"),
    fs = require("fs"),
    _ = require("underscore"),
    general = require("../lib/general"),
    cli = require("./cli");

// privates
var _definitions, 
    _currentGroup, 
    _currentSubGroup;

/**
 @class Config
 @module config-master
 @constructor
 @chainable
*/
function Config(){
    _definitions = {};
    _currentGroup = ""; 
    _currentSubGroup = "";
    return this;
}

/**
Sets the group name given to subsequent option definitions
 @method group
 @param {String} name
 @chainable
*/
Config.prototype.group = function(name){
    _currentGroup = name;
    _currentSubGroup = "";
    return this;
};

/**
Sets the subgroup name given to subsequent option definitions
 @method subgroup
 @param {String} name
 @chainable
*/
Config.prototype.subgroup = function(name){
    _currentSubGroup = name;
    return this;
};

/**
Define an option
 @method option
 @chainable
 @param {String} name
 @param {Object} definition
   @param {String} definition.type `boolean`, `string`, `array` or `number`
   @param {RegExp} [definition.valid] Regular Expression the option value must pass
   @param {Boolean} [definition.default] Default value
   @param {Boolean} [definition.alias] An alternate name for this option
 @example
     var vehicleConfig = new Config()
         .option("maxSpeed", { type: "number", alias: "m", valid: /\d+/, default: 4 })
         .option("isTaxed", { type: "boolean", default: false })
*/
Config.prototype.option = function option(name, definition){
    // set the group if not passed in
    if (typeof definition.group === "undefined"){
        definition.group = groupString();
    }
    
    // create alias
    if (definition.alias !== undefined){
        _definitions[definition.alias] = name;
        // delete definition.alias;
    }
    
    // set default value
    if (definition.default !== undefined){
        definition.value = definition.default;
    }
    
    _definitions[name] = definition;
    return this;
};

/**
@method definition
@param {String} optionName
@return Object
*/
Config.prototype.definition = function(option){
    var item = _definitions[option];
    if (item !== undefined){
        if (typeof item === "string"){
            return _definitions[item];
        } else {
            return item;
        }
    } else {
        throw new Error("unspecified option: " + option);
    }
}

/**
 Returns the number of options in the current group/subgroup
 @method size
 @return {Number} total items
*/
Config.prototype.size = function(){
    return _.where(_definitions, { group: groupString() }).length;
};

/**
 @method hasValue
 @param {Array|String} options If a string is passed, tests whether the option has a value. With an Array passed, tests whether at least one of the options named have a value. 
 @chainable
*/
Config.prototype.hasValue = function(option){
    var self = this;
    
    // check through list for at least one match
    if (Array.isArray(option)){
        return option.some(function(optionName){
            return self.get(optionName) !== undefined;
        });

    // specific option
    } else {
        return self.get(option) !== undefined;
    }
    
    return this;
};

/**
 @method set
 @param {Array|String} option Pass a string to a single value, an Array to set multiple values
 @param {Any} value
 @chainable
*/
Config.prototype.set = function set(option, value){
    var self = this;
    
    if (option){
        if (typeof option === "object" && !Array.isArray(option)){
            var options = option;
            _.each(options, function(value, key){
                self.set(key, value);
            })
        } else {
            if (_definitions[option] !== undefined){
                // alias 
                if (typeof _definitions[option] === "string"){
                    setValue(_definitions[option], value);
                
                }
                // normal
                else {
                    setValue(option, value);
                }
            } else {
                throw new Error("unspecified option: " + option);
            }
        }
    }

    return this;
};

/**
 @method unset
 @param {String} option Delete the option definition
*/
Config.prototype.unset = function unset(option){
    if (_definitions[option] !== undefined){
        delete _definitions[option].value;
    } else {
        throw new Error("unspecified option: " + option);
    }

    return this;
};

/**
 @method get
 @param {String} option Option name
 @return {Any} Option Value
*/
Config.prototype.get = function get(option){
    var item = _definitions[option];
    if (item !== undefined){
        if (typeof item === "string"){
            return _definitions[item].value;
        } else {
            return item.value;
        }
    } else {
        throw new Error("unspecified option: " + option);
    }
};

/**
 @method toJSON
 @param {string} groupName Group name
 @return {Object} Containing Option/value pairs
*/
Config.prototype.toJSON = function() {
    var output = {};
    _.each(_definitions, function(def, key){
        if (def.value !== undefined && def.group && def.group.indexOf(groupString()) > -1){
            output[key] = def.value;  
        }
    });
    return output;
};

/**
 @method parseConfigFile
*/
Config.prototype.parseConfigFile = function parseConfigFile(settings){
    settings = _.defaults(settings || {}, {
        configFilename: ".veelo.json",
        onInvalidJSON: null
    });
    
    var self = this;
    var externalConfig = {};
    
    // define .veelo path
    var configPath = process.platform == "win32"
        ? path.join(process.env.APPDATA, settings.configFilename)
        : path.join(process.env.HOME, settings.configFilename);

    // create config file
    if (!fs.existsSync(configPath)){
        fs.writeFileSync(configPath, fs.readFileSync(path.resolve(__dirname, "options.json")));
    }
    
    // expose options
    try {
        externalConfig = JSON.parse(fs.readFileSync(configPath), "utf-8");
    } catch (err){
        settings.onInvalidJSON && settings.onInvalidJSON(err, configPath);
    }
    
    _.each(externalConfig, function(value, key){
        self.set(key, value);
    });

    return this;
};

/**
 @method parseFromCli
*/
Config.prototype.parseFromCli = function parseFromCli(settings){
    settings = _.defaults(settings || {}, {
        filesOptionName: "inputFiles",
        onInvalidArgs: null,
        onDone: null
    });
    
    var args = cli.parse(_definitions);
    var self = this;
    
    this.group("cli").option(settings.filesOptionName, { type: "array" });
    this.set(settings.filesOptionName, args.files);
    
    _.each(args.args, function(value, key){
        self.set(key, value);
    });
    
    settings.onInvalidArgs && args.invalid.length > 0 && settings.onInvalidArgs(args.invalid);
    settings.onDone && settings.onDone(args);
    
    return this;
};

/**
 @method _getActive
 @private
*/
Config.prototype._getActive = function(){
    var output = _.map(_definitions, function(value, key){
        if (value.value !== undefined){
            return _.extend(value, {name: key});
        }
    });
    return _.compact(output);
}

/**
@method clone
@return Config
*/
Config.prototype.clone = function(){
    var clone = new Config();
    _.each(_definitions, function(def, optionName){
        general.log(optionName + ": " + general.objectToString(def));
        clone.option(optionName, _.clone(def)); 
    });

    return clone;
};

// private functions
function groupString(){
    return _currentGroup + (_currentSubGroup ? "." + _currentSubGroup : "");
}

function setValue(option, value){
    var def = _definitions[option];

    if (def.type !== undefined && typeof value !== def.type.toLowerCase()){
        throw new Error("Invalid type. Option: " + option + " Value: " + value);
    } 
    if (def.valid !== undefined && !def.valid.test(value)){
        throw new Error("Invalid Value. Option: " + option + ", Value: " + value + ", Valid: " + def.valid);
    }
    
    _definitions[option].value = value;
}

module.exports = Config;