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
var _settings,
    _definitions = {},
    _currentGroup = "", 
    _currentSubGroup = "";

// API
exports.group = group;
exports.subgroup = subgroup;
exports.option = option;
exports.size = size;
exports.has = has;
exports.set = set;
exports.get = get;
exports.reset = reset;
exports.toJSON = toJSON;
exports.parseConfigFile = parseConfigFile;
exports.parseCliArgs = parseCliArgs;
exports._definitions = _definitions;       // for testing purposes

function reset(){
    exports._definitions = _definitions = {};
    _currentGroup = "";
    _currentSubGroup = "";
}

function parseCliArgs(settings){
    settings = _.defaults(settings || {}, {
        filesOptionName: "inputFiles",
        onInvalidArgs: null
    });
    
    var args = cliArgs.getArgs(_definitions);
    
    group("cli").option(settings.filesOptionName, { type: "array" });
    set(settings.filesOptionName, args.files);
    
    _.each(args.args, function(value, key){
        set(key, value);
    });
    
    settings.onInvalidArgs && args.invalid.length > 0 && settings.onInvalidArgs(args.invalid);
    
    return exports;
};

function parseConfigFile(settings){
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
        onInvalidJSON && onInvalidJSON(err, configPath);
    }
    
    _.each(externalConfig.defaults, function(value, key){
        set(key, value);
    });

    return exports;
}

function Config1(settings) {
    settings = _.defaults(settings || {}, {
        configFileName: ".veelo.json",
        getPassedIn: false
    });
    
    var externalConfig = {
        defaults: {
            handbrake: {},
            veelo: {}
        }
    };
    _settings = settings;
    
    if (settings && settings.configFileName){
        externalConfig = parseConfigFile(settings.configFileName);
    }
  
    this.defaults = {
        internal: {
            handbrake: {},
            veelo: {
                ext: "m4v",
                archiveDirectory: "veelo-originals",
                ignoreList: []
            }
        },
        external: externalConfig.defaults,
        combined: {
            handbrake: {},
            veelo: {}
        }
    }
    this.passedIn = {
        handbrake: {},
        veelo: {},
        files: []
    };
    this.options = {
        handbrake: {},
        veelo: {},
        files: [] //minus ignored, combined with files from external file? 
    };
    this.presets = externalConfig.presets;
    
    _.defaults(this.defaults.combined.handbrake, this.defaults.external.handbrake, this.defaults.internal.handbrake);
    _.defaults(this.defaults.combined.veelo, this.defaults.external.veelo, this.defaults.internal.veelo);
    
    if (settings && settings.configDefinition && settings.getPassedIn){
        this.passedIn = new cliArgs(settings.configDefinition);
    }
    
    _.defaults(this.options.veelo, this.passedIn.veelo, this.defaults.combined.veelo);
    _.defaults(this.options.handbrake, this.passedIn.handbrake, this.defaults.combined.handbrake);
    this.options.files = this.passedIn.files;
}

function has(option){
    // check through list for at least one match
    if (Array.isArray(option)){
        return option.some(function(optionName){
            return get(optionName) !== undefined;
        });

    // specific option
    } else {
        return get(option) !== undefined;
    }
    
    return exports;
}
function get(option){
    if (_definitions[option] !== undefined){
        return _definitions[option].value;
    } else {
        throw new Error("unspecified option: " + option);
    }
}
function set(option, value){
    if (_definitions[option] !== undefined){
        _definitions[option].value = value;
    } else {
        throw new Error("unspecified option: " + option);
    }

    return exports;
}

function validOption(option){
    return _settings.configDefinition.some(function(group){
        return group.options.some(function(opt){
            var valid = opt.name === option;
            return valid;
        })
    })
}

function group(name){
    _currentGroup = name;
    _currentSubGroup = "";
    return exports;
}
function subgroup(name){
    _currentSubGroup = name;
    return exports;
}
function option(name, definition){
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
}
function size(){
    return _.where(_definitions, { group: groupString() }).length;
}

function toJSON(groupName) {
    var output = {};
    _.each(_definitions, function(def, key){
        if (def.group && def.value !== undefined && def.group.indexOf(groupString()) > -1){
            output[key] = def.value;
        }
    });
    return output;
}


// private functions

function groupString(){
    return _currentGroup + (_currentSubGroup ? "." + _currentSubGroup : "");
}
