var util = require("util"),
    path = require("path"),
    colours = require("colors"),
    fs = require("fs"),
    _ = require("underscore"),
    CliArgs = require("./cli-args");

module.exports = Config;

var _settings;
var configDefinition = {
    veelo: {
        help: { type: "boolean" },
        h: "help",
		hbhelp: { type: "boolean" },
		ext: { type: "string", valid: "\.mp4|\.m4v|\.mkv", default: "m4v" },
		archive : { type: "boolean" }
    },
    handbrake: {
		general: {
    	    update: { type: "boolean" },
            u: "update",
            preset: { type: "string" },
            Z: "preset",
            "preset-list": { type: "boolean" },
            z: "preset-list",
    	    "no-dvdnav": { type: "boolean" }
		}
    }
};
var _definitions = {};

function Config(settings){
    this.defs = _definitions;
}

function Config1(settings) {
    settings = _.defaults(settings || {}, {
        configDefinition: [],
        configFileName: ".veelo.json",
        getPassedIn: false
    });
    
    if (settings.configDefinition == []){
        throw new Error("configDefinition required");
    }
    
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
    return this.options.handbrake[option] !== undefined
        ? this.options.handbrake[option]
        : this.options.veelo[option];
};
Config.prototype.set = function(group, option, value){
    if (validOption(option)){
        if (this.options.handbrake[option] !== undefined){
            this.options.handbrake[option] = value;
        } else if (this.options.veelo[option] !== undefined){
            this.options.veelo[option] = value;
        }
    }
    return this;
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

var _currentGroup;
Config.prototype.group = function(name){
    if (_definitions[name] === undefined){
        _definitions[name] = {};
    }
    _currentGroup = _definitions[name];
    return this;
};
Config.prototype.option = function(name, definition){
    if (_currentGroup === undefined){
        _definitions[name] = definition;
    } else {
        _currentGroup[name] = definition;
    }
    return this;
};