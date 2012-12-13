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
		inputFiles = _config.options.files;
	
	// user asks for help
	if (options.handbraker.h || options.handbraker.help || options.handbraker.hbhelp) {
		getUsage(options.handbraker.hbhelp, function(usage){
			self.emit("message", usage);
		});
	
	// version number
	} else if (options.handbraker.version){
		self.emit("message", "version 0.0.22");
	
	// user passes options that don't require files
	} else if (options.handbrake["preset-list"] || options.handbrake["update"]) {
		var handbrakeCLI = new HandbrakeCLI();
		handbrakeCLI.spawn(options.handbrake, true);

	// user passes files
	} else if (inputFiles.length > 0){
		this.queue.add(inputFiles);

		// --dry-run
		if (options.handbraker["dry-run"]){
			this.emit("report", this.queue.getReport());
			this.queue.cancel();
		} else {
			this.queue.process();
		}
	
	// everything else is invalid usage
	} else {
		self.emit("message", Handbraker.usage);
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

Handbraker.configDefinition = [
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
		name: "handbrake",
		options: [
			// General Options
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
			
			// Source Options
		    {
				name: "title",
		    	alias: "t",
				type: "number"
		    },
		    {
				name: "min-duration",
				type: "number"
		    },
		    {
				name: "scan",
				type: "boolean"
		    },
		    {
				name: "main-feature",
				type: "boolean"
		    },
		    {
				name: "chapters",
				alias: "c",
				type: "string"
		    },
		    {
				name: "angle",
				type: "number"
		    },
		    {
				name: "previews",
				type: "string"
		    },
		    {
				name: "start-at-preview",
				type: "string"
		    },
		    {
				name: "start-at",
				type: "string"
		    },
		    {
				name: "stop-at",
				type: "string"
		    },
			
			// Destination Options
		    {
				name: "format",
				alias: "f",
				type: "string"
		    },
		    {
				name: "markers",
				alias: "m",
				type: "boolean"
		    },
		    {
				name: "large-file",
				alias: "4",
				type: "boolean"
		    },
		    {
				name: "optimize",
				alias: "O",
				type: "boolean"
		    },
		    {
				name: "ipod-atom",
				alias: "I",
				type: "boolean"
		    },
			
			// Video Options
		    {
				name: "encoder",
				alias: "e",
				type: "string"
		    },
		    {
				name: "x264-preset",
				type: "string"
		    },
		    {
				name: "x264-tune",
				type: "string"
		    },
		    {
				name: "encopts",
				alias: "x",
				type: "string"
		    },
		    {
				name: "x264-profile",
				type: "string"
		    },
		    {
				name: "quality",
				alias: "q",
				type: "number"
		    },
		    {
				name: "vb",
				alias: "b",
				type: "number"
		    },
		    {
				name: "two-pass",
				alias: "2",
				type: "boolean"
		    },
		    {
				name: "turbo",
				alias: "T",
				type: "boolean"
		    },
		    {
				name: "rate",
				alias: "r",
				type: "float"
		    },
		    {
				name: "vfr",
				type: "boolean"
		    },
		    {
				name: "cfr",
				type: "boolean"
		    },
		    {
				name: "pfr",
				type: "boolean"
		    }
			
		]
	}
];

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