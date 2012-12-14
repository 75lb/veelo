var	util = require("util"),
	path = require("path"),
	colours = require("colors"),
	fs = require("fs"),
	_ = require("underscore"),
	CliArgs = require("./cli-args");

module.exports = Config;

function Config(configDefinition) {
	var config = {
		internalDefaults: {
			handbrake: {},
			handbraker: {
				ext: "m4v",
				archiveDirectory: "handbraker-originals"
			}
		},
		externalDefaults: parseConfigFile().defaults,
		defaults: {
			handbrake: {},
			handbraker: {}
		},
		passedIn: {
			handbrake: {},
			handbraker: {},
			files: []
		},
		options: {
			handbrake: {},
			handbraker: {},
			files: [] //minus ignored, combined with files from external file? 
		}
	};
	
	_.defaults(config.defaults.handbrake, config.externalDefaults.handbrake, config.internalDefaults.handbrake);
	_.defaults(config.defaults.handbraker, config.externalDefaults.handbraker, config.internalDefaults.handbraker);
	
	config.passedIn = new CliArgs(configDefinition);
	
	_.defaults(config.options.handbraker, config.passedIn.handbraker, config.defaults.handbraker);
	_.defaults(config.options.handbrake, config.passedIn.handbrake, config.defaults.handbrake);
	config.options.files = config.passedIn.files;
	
	// console.log(util.inspect(config, false, null, true));
	return config;
}

Config.prototype.has = function(){};
Config.prototype.get = function(){};

function parseConfigFile(){
	// define .handbraker path
	var configPath = process.platform == "win32"
	    ? path.join(process.env.APPDATA, ".handbraker.json")
	    : path.join(process.env.HOME, ".handbraker.json");

	// create .handbraker
	if (!fs.existsSync(configPath)){
	    fs.writeFileSync(configPath, fs.readFileSync(path.resolve(__dirname, "../options.json")));
	}
	
	// warn old file users
	var oldConfigPath = process.platform == "win32"
	    ? path.join(process.env.APPDATA, ".handbraker")
	    : path.join(process.env.HOME, ".handbraker");
	
	if (fs.existsSync(oldConfigPath)){
		console.log("%s: Handbraker config is now stored in %s, please migrate your defaults then remove the old file (%s)", "Warning".warning, configPath.strong, oldConfigPath.strong);
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