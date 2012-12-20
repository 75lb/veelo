// module dependencies
var	EventEmitter = require("events").EventEmitter,
	_ = require("underscore"),
	fs = require("fs"),
	util = require("util"),
	HandbrakeCLI = require("./handbrakeCli");
	Queue = require("./queue");

// exposed API	
module.exports = Veelo;

// privates 
var _config;

// main class definition
function Veelo(config){
	_config = config;
	this.queue = new Queue(_config);
};

Veelo.prototype = new EventEmitter();

Veelo.prototype.start = function(){
	var self = this,
		options = _config.options,
		inputFiles = _config.options.files;
	
	// user asks for help
	if (options.veelo.h || options.veelo.help || options.veelo.hbhelp) {
		getUsage(options.veelo.hbhelp, function(usage){
			self.emit("message", usage);
		});
	
	// config
	} else if (_config.has("config")){
		console.log(util.inspect(_config.defaults.external, false, null, true));
	
	// version number
	} else if (options.veelo.version){
		var packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
		if (packageJson.version){
			self.emit("message", packageJson.version);
		}
	
	// user passes options that don't require files
	} else if (options.handbrake["preset-list"] || options.handbrake["update"]) {
		var handbrakeCLI = new HandbrakeCLI();
        handbrakeCLI.on("data", function(data){
            self.emit("message", data);
        });
		handbrakeCLI.spawn(options.handbrake, true);

	// user passes files
	} else if (inputFiles.length > 0){
		this.queue.add(inputFiles);

        // custom preset
        if (_config.has("preset")){
            var preset = _config.get("preset");
            if (_config.presets[preset] !== undefined){
                delete _config.options.handbrake.preset;
                delete _config.options.handbrake.Z;
                _.extend(_config.options.handbrake, _config.presets[preset].handbrake);
                _.extend(_config.options.veelo, _config.presets[preset].veelo);
                // console.log(util.inspect(_config.options, false, null, true));
            }
        }

    	// certain commands depend on --verbose
    	if (_config.has(["title", "scan"])){
    		_config.options.veelo.verbose = true;
    	}

		// --dry-run
		if (options.veelo["dry-run"]){
			this.emit("report", this.queue.getReport());
			this.queue.cancel();
		} else {
			this.queue.process();
		}
	
	// everything else is invalid usage
	} else {
		self.emit("message", Veelo.usage);
	}
};

Veelo.usage = 
"\nUsage: veelo [options] [HandbrakeCLI options] [files]\n\n" +
"### Veelo Options-------------------------------------------------------\n" + 
"        --ext <string>         Output file extension (implicitly sets container format). Choose 'mp4', 'm4v' or 'mkv'.\n" +
"        --archive              Archive the original file to a specified directory (default: 'veelo-originals')\n" +
"        --output-dir <string>  Outputs to the specified directory\n" + 
"        --preserve-dates       Preserve input's 'modified' and 'accessed' times on the output file\n" + 
"        --recurse              Traverse into directories\n" + 
"        --include <regex>      Regex include filter, for use with --recurse\n" + 
"        --exclude <regex>      Regex exclude filter, for use with --recurse\n" + 
"        --dry-run              Describe the outcome without performing the actual work\n" + 
"        --embed-srt            If a matching .srt file exists, embed subtitles into the output video\n" +
"    -v, --verbose              Show detailed output\n" +
"        --version              Show version info\n" +
// "        --config               Show current configuration\n" +
"    -h, --help                 Show this help\n" +
"        --hbhelp               Show this help plus all HandbrakeCLI options\n\n";

Veelo.configDefinition = [
	{
		name: "veelo",
		options: [
			{ name: "help", type: "boolean", alias: "h", 
				description: "Show this help" },
			{ name: "hbhelp", type: "boolean", 
				description: "Show this help plus all HandbrakeCLI options" },
			{ name: "ext", type: "string", valid: "\.mp4|\.m4v|\.mkv",
				description: "Output file extension. Choose 'mp4', 'm4v' or 'mkv'" },
			{ name: "archive", type: "boolean", 
				description: "Archive the original file in a 'veelo-originals' directory" },
			{ name: "verbose", type: "boolean", alias: "v", 
				description: "Show this help" },
			{ name: "version", type: "boolean", 
				description: "Show version number" },
			{ name: "config", type: "boolean", description: "Show config" },
			{ name: "embed-srt", type: "boolean", 
				description: "If a matching .srt file exists, embed subtitles into the output video" },
			{ name: "preserve-dates", type: "boolean", 
				description: "Preserve input's 'modified' and 'accessed' times on the output file" },
			{ name: "recurse", type: "boolean", 
				description: "Traverse into directories" },
			{ name: "dry-run", type: "boolean", 
				description: "Describe the outcome without performing the actual work" },
			{ name: "output-dir", type: "string", 
				description: "Outputs to the specified directory" },
			{ name: "include", type: "regex", 
				description: "Regex include filter, for use with --recurse" },
			{ name: "exclude", type: "regex", 
				description: "Regex exclude filter, for use with --recurse" },
			{ name: "ignoreList", type: "array" },
      { name: "ppp", type: "string" }
		]
	},
	{
		name: "handbrake",
		options: [
			// General Options
		    { name: "update", alias: "u", type: "boolean" },
		    { name: "preset", alias: "Z", type: "string" },
		    { name: "preset-list", alias: "z", type: "boolean" },
		    { name: "no-dvdnav", type: "boolean" },
			
			// Source Options
		    { name: "title", alias: "t", type: "number" },
		    { name: "min-duration", type: "number" },
		    { name: "scan", type: "boolean" },
		    { name: "main-feature", type: "boolean" },
		    { name: "chapters", alias: "c", type: "string" },
		    { name: "angle", type: "number" },
		    { name: "previews", type: "string" },
		    { name: "start-at-preview", type: "string" },
		    { name: "start-at", type: "string" },
		    { name: "stop-at", type: "string" },
			
			// Destination Options
		    { name: "format", alias: "f", type: "string" },
		    { name: "markers", alias: "m", type: "boolean" },
		    { name: "large-file", alias: "4", type: "boolean" },
		    { name: "optimize", alias: "O", type: "boolean" },
		    { name: "ipod-atom", alias: "I", type: "boolean" },
			
			// Video Options
		    { name: "encoder", alias: "e", type: "string" },
		    { name: "x264-preset", type: "string" },
		    { name: "x264-tune", type: "string" },
		    { name: "encopts", alias: "x", type: "string" },
		    { name: "x264-profile", type: "string" },
		    { name: "quality", alias: "q", type: "number" },
		    { name: "vb", alias: "b", type: "number" },
		    { name: "two-pass", alias: "2", type: "boolean" },
		    { name: "turbo", alias: "T", type: "boolean" },
		    { name: "rate", alias: "r", type: "float" },
		    { name: "vfr", type: "boolean" },
		    { name: "cfr", type: "boolean" },
		    { name: "pfr", type: "boolean" },
			
			// Audio options
		    { name: "audio", alias: "a", type: "string" },
		    { name: "aencoder", alias: "E", type: "string" },
		    { name: "audio-copy-mask", type: "string" },
		    { name: "audio-fallback", type: "string" },
		    { name: "ab", alias: "B", type: "string" },
		    { name: "aq", alias: "Q", type: "string" },
		    { name: "ac", alias: "C", type: "string" },
		    { name: "mixdown", alias: "6", type: "string" },
		    { name: "arate", alias: "R", type: "string" },
		    { name: "drc", alias: "D", type: "float" },
		    { name: "gain", type: "float" },
		    { name: "aname", alias: "A", type: "string" },
			
			// Picture options
		    { name: "width", alias: "w", type: "number" },
		    { name: "height", alias: "l", type: "number" },
		    { name: "crop", type: "string" },
		    { name: "loose-crop", type: "number" },
		    { name: "maxHeight", alias: "Y", type: "number" },
		    { name: "maxWidth", alias: "X", type: "number" },
		    { name: "strict-anamorphic", type: "boolean" },
		    { name: "loose-anamorphic", type: "boolean" },
		    { name: "custom-anamorphic", type: "boolean" },
		    { name: "display-width", type: "number" },
		    { name: "keep-display-aspect", type: "boolean" },
		    { name: "pixel-aspect", type: "string" },
		    { name: "itu-par", type: "boolean" },
		    { name: "modulus", type: "number" },
		    { name: "color-matrix", alias: "M", type: "string" },
			
			// Filters
		    { name: "deinterlace", alias: "d", type: "string" },
		    { name: "decomb", alias: "5", type: "string" },
		    { name: "detelecine", alias: "9", type: "string" },
		    { name: "denoise", alias: "8", type: "string" },
		    { name: "deblock", alias: "7", type: "string" },
		    { name: "rotate", type: "number" },
		    { name: "grayscale", alias: "g", type: "boolean" },
			
			// Subtitle Options
		    { name: "subtitle", type: "string", alias: "s" },
		    { name: "subtitle-forced", type: "string", alias: "F" },
		    { name: "subtitle-burn", type: "number" },
		    { name: "subtitle-default", type: "number" },
		    { name: "native-language", type: "string", alias: "N" },
		    { name: "native-dub", type: "boolean" },
		    { name: "srt-file", type: "string" },
		    { name: "srt-codeset", type: "string" },
		    { name: "srt-offset", type: "string" },
		    { name: "srt-lang", type: "string" },
		    { name: "srt-default", type: "number" }
		]
	}
];

// internal implementation functions
function getUsage(includeHandbrakeOpts, done){
	var output = Veelo.usage;
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