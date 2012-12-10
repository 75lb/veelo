// module dependencies
var	EventEmitter = require("events").EventEmitter,
	_ = require("underscore"),
	HandbrakeCLI = require("./handbrakeCli");
	Queue = require("./queue");

// exposed API	
module.exports = Handbraker;

// privates 
var _config;

// main class definition
function Handbraker(config){
	_config = config;
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

// internal implementation functions
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
