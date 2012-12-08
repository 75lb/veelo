// module dependencies
var	EventEmitter = require("events").EventEmitter,
	_ = require("underscore"),
	HandbrakeCLI = require("./handbrakeCli");
	Queue = require("./queue");
	
module.exports = Handbraker;

var	HANDBRAKER_SPECIFIC_OPTIONS = [ 
	"_", "$0", "h", "help", "hbhelp", "ext",  
	"archive", "v", "verbose", 
	"embed-srt", "preserve-dates", 
	"recurse", "dry-run", "output-dir", 
	"include", "exclude"
];

function Handbraker(options, config){
	this.options = options;
	this.options.config = config;
	this.processOptions();
	this.queue = new Queue(options);
};

Handbraker.prototype = new EventEmitter();

Handbraker.prototype.processOptions = function(){
	var options = this.options;
	
	// apply defaults from config file
	options.args = _.defaults(options.args, options.config.defaults);
	
	// divide args up 
	options.args = {
		handbraker: _.pick(options.args, HANDBRAKER_SPECIFIC_OPTIONS),
		handbrake: flattenArgsHash(_.omit(options.args, HANDBRAKER_SPECIFIC_OPTIONS)),
		files: options.files
	};
};

Handbraker.prototype.start = function(){
	var self = this,
		args = this.options.args,
		inputFiles = this.options.files;
	
	// show usage and exit
	if (args.handbraker.h || 
		args.handbraker.help || 
		args.handbraker.hbhelp || 
		(inputFiles.length == 0 && _.intersection(args.handbrake, ["--preset-list", "title", "scan"]).length == 0)){
		getUsage(args.handbraker.hbhelp, function(usage){
			self.emit("message", usage);
		});

	// user passed --preset-list, --title or --scan
	} else if (inputFiles.length == 0 && _.intersection(args.handbrake, ["--preset-list", "title", "scan"]).length > 0) {
		var handbrake = new HandbrakeCLI();
		handbrake.spawn(args.handbrake, true);
	
	// regular use case
	} else {
		this.queue.add(inputFiles);
		this.queue.process();
	}
};

Handbraker.usage = 
"\nUsage: handbraker [options] [HandbrakeCLI options] [files]\n\n" +
"### Handbraker Options-------------------------------------------------------\n" + 
"        --ext                  Output file extension. Choose 'mp4', 'm4v' or 'mkv' (default: m4v)\n" +
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
		var handbrake = new HandbrakeCLI();
		handbrake.exec("-h", function(stdout, stderr){
			output += stdout.replace(/^.*$\n\n/m, "");
			done(output);
		});
	} else {
		done(output);
	}
}
