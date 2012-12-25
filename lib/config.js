var util = require("util"),
    path = require("path"),
    colours = require("colors"),
    fs = require("fs"),
    _ = require("underscore"),
    CliArgs = require("./cli-args");

module.exports = Config;

var _settings;

var configDefinition2 = {
    help: { type: "boolean", group: "veelo" },
	hbhelp: { type: "boolean", group: "veelo" },
	ext: { type: "string", valid: "\.mp4|\.m4v|\.mkv", default: "m4v", group: "veelo" },
	archive : { type: "boolean", group: "veelo" },
    update: { type: "boolean", group: "handbrake.general" },
    preset: { type: "string", group: "handbrake.general" },
    "preset-list": { type: "boolean", group: "handbrake.general" },
    "no-dvdnav": { type: "boolean", group: "handbrake.general" },
    h: "help",
    u: "update",
    z: "preset-list",
    Z: "preset"
};

var _definition = {};

function Config(settings){
    this.definition = _definition;
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
        this.passedIn = new CliArgs(settings.configDefinition);
    }
    
    _.defaults(this.options.veelo, this.passedIn.veelo, this.defaults.combined.veelo);
    _.defaults(this.options.handbrake, this.passedIn.handbrake, this.defaults.combined.handbrake);
    this.options.files = this.passedIn.files;
    
    // console.log(util.inspect(_config, false, null, true));
}

Config.prototype.has = function(option){
    var self = this;
    if (Array.isArray(option)){
        return option.some(function(key){
            return self.options.handbrake[key] !== undefined || self.options.veelo[key] !== undefined;
        });
    } else {
        return this.options.handbrake[option] !== undefined || this.options.veelo[option] !== undefined;
    }
};
Config.prototype.get = function(option){
    return _definition[option];
};
Config.prototype.set = function(option, value){
    _definition[option] = value;
};

function parseConfigFile(configFileName){
    // define .veelo path
    var configPath = process.platform == "win32"
        ? path.join(process.env.APPDATA, configFileName)
        : path.join(process.env.HOME, configFileName);

    // create config file
    if (!fs.existsSync(configPath)){
        fs.writeFileSync(configPath, fs.readFileSync(path.resolve(__dirname, "../options.json")));
    }
    
    // expose options
    try {
        return JSON.parse(fs.readFileSync(configPath), "utf-8");
    } catch (err){
        console.error("Fatal error parsing config: ".red + err);
        console.error("Please ensure this config file is valid JSON: " + configPath);
        process.exit(1);
    }
}

function validOption(option){
    return _settings.configDefinition.some(function(group){
        return group.options.some(function(opt){
            var valid = opt.name === option;
            // if (valid){
            //     console.log("option valid: %s", option);
            // }
            return valid;
        })
    })
}

var _currentGroup = "", 
    _currentSubGroup = "";
Config.prototype.group = function(name){
    _currentGroup = name;
    return this;
};
Config.prototype.subgroup = function(name){
    _currentSubGroup = name;
    return this;
};
Config.prototype.option = function(name, definition){
    definition.group = _currentGroup + (_currentSubGroup ? "." + _currentSubGroup : "");
    _definition[name] = definition;
    return this;
};