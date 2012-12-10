// module dependencies
var	EventEmitter = require("events").EventEmitter,
	_ = require("underscore"),
	HandbrakeCLI = require("./handbrakeCli");
	Queue = require("./queue");
	
module.exports = Handbraker;

var _config = {
	defaultOptions: {},
	ignoreList: [],
	archiveDirectory: "",
	options: {
		handbraker: {},
		handbrake: {}
	},
	inputFiles: []
};

function Handbraker(cliArgs, configFile){
	_config.defaultOptions = configFile.defaultOptions;
	_config.ignoreList = configFile.ignoreList;
	_config.archiveDirectory = configFile.archiveDirectory;	
	_config.inputFiles = cliArgs.files;
	_config.options = _.defaults(cliArgs.options, _config.defaultOptions);
	_config.options = divideOptions(_config.options);
	this.queue = new Queue(_config);
};

Handbraker.prototype = new EventEmitter();

Handbraker.prototype.start = function(){
	var self = this,
		options = _config.options,
		inputFiles = _config.inputFiles;
	
	// show usage and exit
	if (options.handbraker.h || 
		options.handbraker.help || 
		options.handbraker.hbhelp || 
		(inputFiles.length == 0 && _.intersection(options.handbrake, ["--preset-list", "title", "scan"]).length == 0)){
		getUsage(options.handbraker.hbhelp, function(usage){
			self.emit("message", usage);
		});

	// user passed --preset-list, --title or --scan
	} else if (inputFiles.length == 0 && _.intersection(options.handbrake, ["--preset-list", "title", "scan"]).length > 0) {
		var handbrakeCLI = new HandbrakeCLI();
		handbrakeCLI.spawn(options.handbrake, true);
		
	// --dry-run
	} else if (options.handbraker["dry-run"]){
		this.queue.add(inputFiles);
		this.emit("report", this.queue.getReport());
		this.queue.cancel();
	
	// regular use case
	} else {
		this.queue.add(inputFiles);
		this.queue.process();
	}
};

Handbraker.usage = 
"\nUsage: handbraker [options] [HandbrakeCLI options] [files]\n\n" +
"### Handbraker Options-------------------------------------------------------\n" + 
"        --ext                  Output file extension. Choose 'mp4', 'm4v' or 'mkv'\n" +
"        --archive              Archive the original file in a 'handbraker-originals' directory\n" +
"        --output-dir           Outputs to the specified directory\n" + 
"        --preserve-dates       Preserve input's 'modified' and 'accessed' times on the output file\n" + 
"        --recurse              Traverse into directories\n" + 
"        --include              Regex include filter, for use with --recurse\n" + 
"        --exclude              Regex exclude filter, for use with --recurse\n" + 
"        --dry-run              Describe the outcome without performing the actual work\n" + 
"        --embed-srt            If a matching .srt file exists, embed subtitles into the output video\n" +
"    -v, --verbose              Show detailed output\n" +
"    -h, --help                 Show this help\n" +
"        --hbhelp               Show this help plus all HandbrakeCLI options\n\n";

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

function getUsage(includeHandbrakeOpts, done){
	var output = Handbraker.usage;
	if (includeHandbrakeOpts){
		var handbrakeCLI = new HandbrakeCLI();
		handbrakeCLI.exec("-h", function(stdout, stderr){
			output += stdout.replace(/^.*$\n\n/m, "");
			done(output);
		});
	} else {
		done(output);
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
		handbrake: flattenArgsHash(_.omit(options, HANDBRAKER_SPECIFIC_OPTIONS))
	};
}
