var	path = require("path"),
	colours = require("colors"),
	fs = require("fs"),
	_ = require("underscore"),
	cliArgs = require("./cli-args");

module.exports = Config;

function Config() {
	var minimumConfig = {
			options: {
				default: {
					handbrake: [],
					handbraker: {
						ext: "m4v"
					}
				},
				passedIn: {
					handbrake: [],
					handbraker: {}
				}
			},
			ignoreList: [".DS_Store"],
			archiveDirectory: "handbraker-originals",
			inputFiles: []
		},
		externalConfig = parseConfigFile(),
		config = _.defaults(externalConfig, minimumConfig);
	
	config.inputFiles = cliArgs.files;
	config.options.passedIn = cliArgs.options;
	config.options.passedIn = divideOptions(config.options.passedIn);
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

function flattenArgsHash(argsHash){
	var output;
	output = _.pairs(argsHash);
	output.forEach(function(pair){
		if (pair[0].length == 1){
			pair[0] = "-" + pair[0];
		} else {
			pair[0] = "--" + pair[0];
		}
	});
	output = _.flatten(output);
	return output;
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
		handbrake: flattenArgsHash(_.omit(options, HANDBRAKER_SPECIFIC_OPTIONS))
	};
}
