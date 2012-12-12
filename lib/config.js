// validate passed in args
// apply external defaults
// apply internal defaults
// group options
// 

var	util = require("util"),
	path = require("path"),
	colours = require("colors"),
	fs = require("fs"),
	_ = require("underscore"),
	cliArgs = require("./cli-args");

module.exports = Config;

var configGroups = [
	{
		name: "handbraker",
		options: [
			{ 
				name: "help",
				alias: "h",
				type: "boolean",
				description: "Show this help"
			},
			{
				name: "hbhelp",
				type: "boolean",
				description: "Show this help plus all HandbrakeCLI options"
			},
			{
				name: "ext",
				description: "Output file extension. Choose 'mp4', 'm4v' or 'mkv'",
				type: "string",
				valid: "\.mp4|\.m4v|\.mkv"
			},
			{
				name: "archive",
				type: "boolean",
				description: "Archive the original file in a 'handbraker-originals' directory"
			},
			{
				name: "verbose",
				alias: "v",
				type: "boolean",
				description: "Show this help"
			},
			{
				name: "version",
				type: "boolean",
				description: "Show version number"
			},
			{
				name: "embed-srt",
				type: "boolean",
				description: "If a matching .srt file exists, embed subtitles into the output video"
			},
			{
				name: "preserve-dates",
				type: "boolean",
				description: "Preserve input's 'modified' and 'accessed' times on the output file"
			},
			{
				name: "recurse",
				type: "boolean",
				description: "Traverse into directories"
			},
			{
				name: "dry-run",
				type: "boolean",
				description: "Describe the outcome without performing the actual work"
			},
			{
				name: "output-dir",
				description: "Outputs to the specified directory"
			},
			{
				name: "include",
				description: "Show version number"
			},
			{
				name: "exclude",
				description: "Show version number"
			}
			
		]
	},
	{
		name: "General",
		options: [
		    {
				name: "update",
		    	alias: "u",
				type: "boolean"
		    },
		    {
				name: "preset",
		    	alias: "Z",
				type: "string"
		    },
		    {
				name: "preset-list",
		    	alias: "z",
				type: "boolean"
		    },
		    {
				name: "no-dvdnav",
				type: "boolean"
		    },
		    {
				name: "title",
		    	alias: "t",
				type: "number"
		    },
		    {
				name: "min-duration",
				type: "number"
		    }
		]
	}
];

console.log(cliArgs(configGroups));

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
			handbraker: {},
			files: []
		},
		options: {
			handbrake: {},
			handbraker: {},
			files: [] // minus ignored 
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


// validate passed in options, e.g. isNumber, RegEx
// validate passed in files, e.g. file exists
// custom validate - e.g. video file has a valid title
// Kong Fig Master
// grouped options, to separate options passed to child_process
