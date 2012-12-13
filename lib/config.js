// validate all options set
// get passed in options
// apply external defaults
// apply internal defaults
// group options

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


// validate passed in options, e.g. isNumber, RegEx
// validate passed in files, e.g. file exists
// custom validate - e.g. video file has a valid title
// Kong Fig Master
// grouped options, to separate options passed to child_process
// test all defaults against 'invalid option', e.g. from cli, external default, internal defaults 