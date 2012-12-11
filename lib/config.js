var	util = require("util"),
	path = require("path"),
	colours = require("colors"),
	fs = require("fs"),
	_ = require("underscore"),
	cliArgs = require("./cli-args");

module.exports = Config;

function Config() {
	var minimumConfig = {
		defaults: {
			handbrake: {},
			handbraker: {
				ext: "m4v"
			}
		},
		passedIn: {
			handbrake: {},
			handbraker: {}
		},
		options: {
			handbrake: {},
			handbraker: {}
		},
		ignoreList: [".DS_Store"],
		archiveDirectory: "handbraker-originals",
		inputFiles: []
	};

	var	externalConfig = parseConfigFile(),
		config = _.defaults(externalConfig, minimumConfig);
	
	config.inputFiles = cliArgs.files;
	config.passedIn = cliArgs.options;
	config.passedIn = divideOptions(config.passedIn);
	_.defaults(config.options.handbraker, config.passedIn.handbraker, config.defaults.handbraker);
	_.defaults(config.options.handbrake, config.passedIn.handbrake, config.defaults.handbrake);
	console.log(util.inspect(config, false, null, true));
	return config;
}

function parseConfigFile(){
	// define .handbraker path
	var configPath = process.platform == "win32"
	        ? path.join(process.env.APPDATA, ".handbraker")
	        : path.join(process.env.HOME, ".handbraker");

	// create .handbraker
	if (!fs.existsSync(configPath)){
	        fs.writeFileSync(configPath, fs.readFileSync(path.resolve(__dirname, "../options.json")));
	}

	// expose options
	try {
	        return JSON.parse(fs.readFileSync(configPath));
	} catch (err){
	        console.error("Fatal error parsing config: ".red + err);
	        console.error("Please ensure this config file is valid JSON: " + configPath);
	        process.exit(1);
	}
}

function divideOptions(options){
	var	HANDBRAKER_SPECIFIC_OPTIONS = [ 
		"_", "$0", "h", "help", "hbhelp", "ext",  
		"archive", "v", "verbose", 
		"embed-srt", "preserve-dates", 
		"recurse", "dry-run", "output-dir", 
		"include", "exclude"
	];

	return {
		handbraker: _.pick(options, HANDBRAKER_SPECIFIC_OPTIONS),
		handbrake: _.omit(options, HANDBRAKER_SPECIFIC_OPTIONS)
	};
}
