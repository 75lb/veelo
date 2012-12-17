var	util = require("util"),
	path = require("path"),
	colours = require("colors"),
	fs = require("fs"),
	_ = require("underscore"),
	CliArgs = require("./cli-args");

module.exports = Config;

function Config(configDefinition) {
  var externalConfig = parseConfigFile();
  
	this.defaults = {
		internal: {
			handbrake: {},
			veelo: {
				ext: "m4v",
				archiveDirectory: "veelo-originals"
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
	
	this.passedIn = new CliArgs(configDefinition);
	
	_.defaults(this.options.veelo, this.passedIn.veelo, this.defaults.combined.veelo);
	_.defaults(this.options.handbrake, this.passedIn.handbrake, this.defaults.combined.handbrake);
	this.options.files = this.passedIn.files;
	
	// console.log(util.inspect(_config, false, null, true));
}

Config.prototype.has = function(option){
	return this.options.handbrake[option] !== undefined || this.options.veelo[option] !== undefined;
};
Config.prototype.get = function(option){
    return this.options.handbrake[option] !== undefined
        ? this.options.handbrake[option]
        : this.options.veelo[option];
};

function parseConfigFile(){
	// define .veelo path
	var configPath = process.platform == "win32"
	    ? path.join(process.env.APPDATA, ".veelo.json")
	    : path.join(process.env.HOME, ".veelo.json");

	// create .veelo
	if (!fs.existsSync(configPath)){
	    fs.writeFileSync(configPath, fs.readFileSync(path.resolve(__dirname, "../options.json")));

		// warn old file users
		var oldConfigPath = process.platform == "win32"
		    ? path.join(process.env.APPDATA, ".handbrake.json")
		    : path.join(process.env.HOME, ".handbrake.json");
		if (fs.existsSync(oldConfigPath)){
			console.log(
				"\n\n%s\n======================\nVeelo config is now stored in %s.\nPlease migrate your defaults from %s then remove the file.\n", 
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