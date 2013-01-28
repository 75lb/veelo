// module dependencies
var util = require("util"),
    path = require("path"),
    fs = require("fs"),
    _ = require("underscore"),
    cliArgs = require("./cli-args");

// privates
var _definitions = {},
    _currentGroup = "", 
    _currentSubGroup = "";

function Config(){
    return this;
}

Config.prototype.group = function group(name){
    _currentGroup = name;
    _currentSubGroup = "";
    return this;
};

Config.prototype.subgroup = function subgroup(name){
    _currentSubGroup = name;
    return this;
};

Config.prototype.option = function option(name, definition){
    definition.group = groupString();
    
    // create alias
    if (definition.alias !== undefined){
        _definitions[definition.alias] = name;
        delete definition.alias;
    }
    
    // set default value
    if (definition.defaultVal !== undefined){
        definition.value = definition.defaultVal;
    }
    
    _definitions[name] = definition;
    return this;
};

Config.prototype.size = function size(){
    return _.where(_definitions, { group: groupString() }).length;
};

Config.prototype.has = function has(option){
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

Config.prototype.unset = function unset(option){
    if (_definitions[option] !== undefined){
        delete _definitions[option].value;
    } else {
        throw new Error("unspecified option: " + option);
    }

    return this;
};

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

Config.prototype.reset = function reset(){
    this._definitions = _definitions = {};
    _currentGroup = "";
    _currentSubGroup = "";
};

Config.prototype.toJSON = function toJSON(groupName) {
    var output = {};
    _.each(_definitions, function(def, key){
        if (groupName){
            if (def.group && def.value !== undefined && def.group.indexOf(groupString()) > -1){
                output[key] = def.value;
            } 
        } else {
            output[key] = def.value;
        }
    });
    return output;
};

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

Config.prototype.parseFromCli = function parseFromCli(settings){
    settings = _.defaults(settings || {}, {
        filesOptionName: "inputFiles",
        onInvalidArgs: null,
        onDone: null
    });
    
    var args = cliArgs.getArgs(_definitions);
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

Config.prototype._definitions = _definitions;       // for testing purposes

Config.prototype._getActive = function(){
    var output = _.map(_definitions, function(value, key){
        if (value.value !== undefined){
            return _.extend(value, {name: key});
        }
    });
    return _.compact(output);
}

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