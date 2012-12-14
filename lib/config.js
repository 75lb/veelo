var	util = require("util"),
	path = require("path"),
	colours = require("colors"),
	fs = require("fs"),
	_ = require("underscore"),
	CliArgs = require("./cli-args");

module.exports = Config;

function Config(configDefinition) {
	this.defaults = {
		internal: {
			handbrake: {},
			handbraker: {
				ext: "m4v",
				archiveDirectory: "handbraker-originals"
			}
		},
		external: parseConfigFile().defaults,
		combined: {
			handbrake: {},
			handbraker: {}
		}
	}
	this.passedIn = {
		handbrake: {},
		handbraker: {},
		files: []
	};
	this.options = {
		handbrake: {},
		handbraker: {},
		files: [] //minus ignored, combined with files from external file? 
	};
	
	_.defaults(this.defaults.combined.handbrake, this.defaults.external.handbrake, this.defaults.internal.handbrake);
	_.defaults(this.defaults.combined.handbraker, this.defaults.external.handbraker, this.defaults.internal.handbraker);
	
	this.passedIn = new CliArgs(configDefinition);
	
	_.defaults(this.options.handbraker, this.passedIn.handbraker, this.defaults.combined.handbraker);
	_.defaults(this.options.handbrake, this.passedIn.handbrake, this.defaults.combined.handbrake);
	this.options.files = this.passedIn.files;
	
	// console.log(util.inspect(_config, false, null, true));
}

Config.prototype.has = function(option){
	return this.options.handbrake[option] !== undefined || this.options.handbraker[option] !== undefined;
};
Config.prototype.get = function(){};

function parseConfigFile(){
	// define .handbraker path
	var configPath = process.platform == "win32"
	    ? path.join(process.env.APPDATA, ".handbraker.json")
	    : path.join(process.env.HOME, ".handbraker.json");

	// create .handbraker
	if (!fs.existsSync(configPath)){
	    fs.writeFileSync(configPath, fs.readFileSync(path.resolve(__dirname, "../options.json")));

		// warn old file users
		var oldConfigPath = process.platform == "win32"
		    ? path.join(process.env.APPDATA, ".handbraker")
		    : path.join(process.env.HOME, ".handbraker");
		if (fs.existsSync(oldConfigPath)){
			console.log(
				"\n\n%s\n======================\nHandbraker config is now stored in %s.\nPlease migrate your defaults from %s then remove the file.\n", 
				"FIRST AND ONLY WARNING".warning, configPath.strong, oldConfigPath.strong
			);
		}
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