// switch module from returning a Class constructor to an object
// state is configured by chained methods in calling code (cli.js), then dependents require the module to access current state
// config = require("config").group().option().option().parseCliArgs().parseConfigFile().set("other", {})

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

// API
exports.group = function group(name){
    _currentGroup = name;
    _currentSubGroup = "";
    return exports;
};

exports.subgroup = function subgroup(name){
    _currentSubGroup = name;
    return exports;
};

exports.option = function option(name, definition){
    definition.group = groupString();
    
    // create alias
    if (definition.alias !== undefined){
        _definitions[definition.alias] = name;
        delete definition.alias;
    }
    
    // set default value
    if (definition.default !== undefined){
        definition.value = definition.default;
    }
    
    _definitions[name] = definition;
    return exports;
};

exports.size = function size(){
    return _.where(_definitions, { group: groupString() }).length;
};

exports.has = function has(option){
    // check through list for at least one match
    if (Array.isArray(option)){
        return option.some(function(optionName){
            return exports.get(optionName) !== undefined;
        });

    // specific option
    } else {
        return exports.get(option) !== undefined;
    }
    
    return exports;
};

exports.set = function set(option, value){
    if (typeof option === "object" && !Array.isArray(option)){
        var options = option;
        _.each(options, function(value, key){
            exports.set(key, value);
        })
    } else {
        if (_definitions[option] !== undefined){
            _definitions[option].value = value;
        } else {
            throw new Error("unspecified option: " + option);
        }
    }

    return exports;
};

exports.unset = function unset(option){
    if (_definitions[option] !== undefined){
        delete _definitions[option].value;
    } else {
        throw new Error("unspecified option: " + option);
    }

    return exports;
};

exports.get = function get(option){
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

exports.reset = function reset(){
    exports._definitions = _definitions = {};
    _currentGroup = "";
    _currentSubGroup = "";
};

exports.toJSON = function toJSON(groupName) {
    var output = {};
    _.each(_definitions, function(def, key){
        if (def.group && def.value !== undefined && def.group.indexOf(groupString()) > -1){
            output[key] = def.value;
        }
    });
    return output;
};

exports.parseConfigFile = function parseConfigFile(settings){
    settings = _.defaults(settings || {}, {
        configFilename: ".veelo.json",
        onInvalidJSON: null
    });
    
    var externalConfig = {};
    
    // define .veelo path
    var configPath = process.platform == "win32"
        ? path.join(process.env.APPDATA, settings.configFilename)
        : path.join(process.env.HOME, settings.configFilename);

    // create config file
    if (!fs.existsSync(configPath)){
        fs.writeFileSync(configPath, fs.readFileSync(path.resolve(__dirname, "../options.json")));
    }
    
    // expose options
    try {
        externalConfig = JSON.parse(fs.readFileSync(configPath), "utf-8");
    } catch (err){
        settings.onInvalidJSON && settings.onInvalidJSON(err, configPath);
    }
    
    _.each(externalConfig, function(value, key){
        exports.set(key, value);
    });

    return exports;
};

exports.parseCliArgs = function parseCliArgs(settings){
    settings = _.defaults(settings || {}, {
        filesOptionName: "inputFiles",
        onInvalidArgs: null
    });
    
    var args = cliArgs.getArgs(_definitions);
    
    exports.group("cli").option(settings.filesOptionName, { type: "array" });
    exports.set(settings.filesOptionName, args.files);
    
    _.each(args.args, function(value, key){
        exports.set(key, value);
    });
    
    settings.onInvalidArgs && args.invalid.length > 0 && settings.onInvalidArgs(args.invalid);
    
    return exports;
};

exports._definitions = _definitions;       // for testing purposes

exports._getActive = function(){
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
