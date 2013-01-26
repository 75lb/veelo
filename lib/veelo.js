/**
 The Video Library Optimisation (V-LO) tool.
 @module veelo 
*/

// module dependencies 
var EventEmitter = require("events").EventEmitter,
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    _ = require("underscore"),
    handbrakeCLI = require("./handbrakeCli"),
    config = require("./config"),
    shared = require("../test/shared"),
    Job = require("./job");

/**
Synopsis: 

    var veelo = require("veelo");
     
    veelo.on("complete", function(){
        console.log("Finished.");
    });

    veelo.config.add("preset", "iPod")
         .config.add("output-dir", "ipod films")
         .add("a shitty comedy.avi")
         .add("some other crap.wmv")
         .start();

@class veelo
@static
*/
var veelo = new EventEmitter();
        
// event definitions
var e = {
    /**
    Fired when you need to know something
    @event message
    @param {String} msg The message content
    */
    msg: "message",
    
    /**
    Fired with your report
    @event report
    */
    report: "report",
    
    /**
    Fired with a warning
    @event warning
    */
    warning: "warning",
    
    /**
    @event output
    */
    output: "output",
    
    /**
    @event starting
    */
    starting: "starting",
    
    /**
    @event complete
    */
    complete: "complete",
    
    /**
    @event processing
    */
    processing: "processing",
    
    /**
    @event error
    */
    error: "error",
    
    /**
    @event job-fail
    */
    jobFail: "job-fail",
    
    /**
    @event progress
    */
    progress: "progress"
    
};

// privates
var _isCancelled = false;

var _stats = {
    clone: function(){
        return {
            time: _.clone(this.time),
            jobs: _.clone(this.jobs)
        };
    },
    init: function(){
        this.time = {
            start: null, 
            end: null, 
            total: null
        };
        this.jobs = {
            valid: 0, 
            invalid: 0,
            ignored: 0,    
            failed: 0, 
            successful: 0,
            fileExtensions: {}
        };
    }
};
_stats.init();

var _jobs = {
    init: function(){
        /**
        Valid Jobs
        @property jobs.valid
        @type {Array}
        */
        this.valid = [];
        
        /**
        list containing invalid jobs
        @property jobs.invalid
        @type {Array}
        */
        this.invalid = [];
    },
        
    /**
    list of failed jobs. 
    @property jobs.failed
    @type {Array}
    */
    failed: function(){
        return this.valid.filter(function(job){
            return job.is.complete && job.is.successful === false; 
        });
    },

    /**
    list of successful jobs. 
    @property jobs.successful
    @type {Array}
    */
    successful: function(){
        return this.valid.filter(function(job){
            return job.is.complete && job.is.successful === true; 
        });
    }
};
_jobs.init();



/**
Configuration Management object, used to set options on Veelo.
@property config
@type Config  
@example
    veelo.config.set("dry-run", true)
         .add("Set you Ablaze.avi")
         .start();
*/
veelo.config = config;

/**
 Add a file or array of files to the queue.
 @method add
 @param {String|Array} file The file, or files to add
 @chainable
*/
veelo.add = function add(files){

    // single file may be passed as a string
    if (typeof files === "string"){
        files = [files];
    }
    
    // Recurse mode
    if (config.get("recurse")){
        files = expandFileList(files);
    }

    files.forEach(function(filePath){
        var job = new Job({
            inputPath: filePath
        });
        job.on("invalid", function(msg){
            _stats.jobs.invalid++;
            _jobs.invalid.push(job);
            veelo.emit(e.msg, msg);
        });
        job.on("valid", function(){
            _stats.jobs.valid++;
            var ext = path.extname(filePath).toLowerCase();
            _stats.jobs.fileExtensions[ext] = (_stats.jobs.fileExtensions[ext] || 0) + 1;
            _jobs.valid.push(job);
        });
        job.on("processing", function(file){
            veelo.emit(e.processing, file);
        });

        job.validate();
    });

    return veelo;
};

/**
 Clear the queue
 @method clear
 @chainable
*/
veelo.clear = function clear(){
    _jobs.init();
    _stats.init();
    return veelo;
};

/**
 Start processing.
 @method start
*/
veelo.start = function start(){
    _stats.time.start = Date.now();
    this.emit(e.starting, _stats.clone());

    // user asks for help
    if (config.has(["help", "hbhelp"])) {
        getUsage(config.get("hbhelp"), function(usage){
            veelo.emit("message", usage);
        });

    // config
    } else if (config.has("config")){
        veelo.emit("message", config._getActive().map(function(item){
            return item.name + ": " + item.value;
        }));
    
    // version number
    } else if (config.get("version")){
        var packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8"));
        if (packageJson.version){
            veelo.emit("message", packageJson.version);
        }
    
    // user passes options that don't require files
    } else if (config.has(["preset-list", "update"])) {
        handbrakeCLI.run(config.group("handbrake").toJSON(), function(stdout, stderr){
            veelo.emit("message", stdout + stderr);
        });

    // user passes files
    } else if (_stats.jobs.valid > 0){

        // custom preset
        if (config.has("preset")){
            var preset = config.get("preset"),
                udp = config.get("user-defined-presets")[preset];
            
            if (udp !== undefined){
                config.unset("preset");
                config.set(udp);
            }
        }

        // certain commands depend on --verbose
        if (config.has(["title", "scan"])){
            config.set("verbose", true);
        }

        // --dry-run
        if (config.has("dry-run")){
            veelo.emit("report", veelo.getReport());
            veelo.cancel();
        } else {
            var self = this
            if (_jobs.valid.length > 0){
        
                function processNext(){
                    var job = _jobs.valid.shift();
                    if (job && !_isCancelled){
                        job.on("success", function(){
                            _stats.jobs.successful++;
                            processNext();
                        });
                        job.on("error", function(data){
                            _stats.jobs.failed++;
                            self.emit(e.jobFail, data);
                            processNext();
                        });
                        job.on("message", function(msg){
                            self.emit(e.msg, msg);
                        });
                        job.on("output", function(msg){
                            veelo.emit(e.output, msg);
                        });
                        job.on("progress", function(progress){
                            progress.queuePosition = -1;
                            progress.queueSize = -1;
                            veelo.emit(e.progress, progress);
                        });
                        
                        job.process();
                    } else {
                        // on processing completion, record the 'end' and 'elapsed' times
                        _stats.time.end = Date.now();
                        var elapsed = new Date(_stats.time.end - _stats.time.start),
                            hours = elapsed.getHours(),
                            minutes = elapsed.getMinutes(),
                            seconds = elapsed.getSeconds();
                        _stats.time.elapsed = 
                            (hours ? hours + "h ": "") + 
                            (minutes ? minutes + "m " : "") + 
                            (seconds ? seconds + "s" : "0s");

                        self.emit(e.complete);
                    }
                }
                processNext();
            } else {
                this.emit(e.msg, "nothing to process");
            }
        }
    
    // everything else is invalid usage
    } else {
        veelo.emit("message", veelo.usage);
    }
};

/**
For unit-testing purposes
@private
@method _inject
*/
veelo._inject = function _inject(MockJob){
    Job = MockJob;
}

veelo.usage = 
"\nUsage: veelo [options] [HandbrakeCLI options] [files]\n\n" +
"### Veelo Options-------------------------------------------------------\n" + 
"        --ext <string>         Output file extension (implicitly sets container format). Choose 'mp4', 'm4v' or 'mkv'.\n" +
"        --archive              Archive the original file to a specified directory (defaultVal: 'veelo-originals')\n" +
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

// internal implementation functions
function getUsage(includeHandbrakeOpts, done){
    var output = veelo.usage;
    if (includeHandbrakeOpts){
        handbrakeCLI.run({ h: true }, function(stdout, stderr){
            output += stdout.replace(/^.*$\n\n/m, "");
            done(output);
        });
    } else {
        done(output);
    }
}

// Define Veelo configuration options
config
    .group("veelo")
        .option("help", { type: "boolean", alias: "h" })
        .option("hbhelp", { type: "boolean" })
        .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", defaultVal: "m4v" })
        .option("archive", { type: "boolean" })
        .option("archiveDirectory", { type: "string", defaultVal: "veelo-originals" })
        .option("verbose", { type: "boolean", alias: "v" })
        .option("version", { type: "boolean" })
        .option("config", { type: "boolean" })
        .option("embed-srt", { type: "boolean" })
        .option("preserve-dates", { type: "boolean" })
        .option("recurse", { type: "boolean" })
        .option("dry-run", { type: "boolean" })
        .option("output-dir", { type: "string" })
        .option("include", { type: "regex" })
        .option("exclude", { type: "regex" })
        .option("ignoreList", { type: "array", defaultVal: [] })
        .option("user-defined-presets", { type: "object" })
    .group("handbrake")
        .subgroup("general")
            .option("update", { type: "boolean", alias: "u" })
            .option("preset", { type: "string", alias: "Z" })
            .option("preset-list", { type: "boolean", alias: "z" })
            .option("no-dvdnav", { type: "boolean" })
        .subgroup("source")
            .option("title", { type: "number", alias: "t" })
            .option("min-duration", { type: "number" })
            .option("scan", { type: "boolean" })
            .option("main-feature", { type: "boolean" })
            .option("chapters", { type: "string", alias: "c" })
            .option("angle", { type: "number" })
            .option("previews", { type: "string" })
            .option("start-at-preview", { type: "string" })
            .option("start-at", { type: "string" })
            .option("stop-at", { type: "string" })
        .subgroup("destination")
            .option("format", { type: "string", alias: "f" })
            .option("markers", { type: "boolean", alias: "m" })
            .option("large-file", { type: "boolean", alias: "4" })
            .option("optimize", { type: "boolean", alias: "O" })
            .option("ipod-atom", { type: "boolean", alias: "I" })
        .subgroup("video")            
            .option("encoder", { type: "string", alias: "e" })
            .option("x264-preset", { type: "string" })
            .option("x264-tune", { type: "string" })
            .option("encopts", { type: "string", alias: "x" })
            .option("x264-profile", { type: "string" })
            .option("quality", { type: "number", alias: "q" })
            .option("vb", { type: "number", alias: "b" })
            .option("two-pass", { type: "boolean", alias: "2" })
            .option("turbo", { type: "boolean", alias: "T" })
            .option("rate", { type: "float", alias: "r" })
            .option("vfr", { type: "boolean" })
            .option("cfr", { type: "boolean" })
            .option("pfr", { type: "boolean" })
        .subgroup("audio")            
            .option("audio", { type: "string", alias: "a" })
            .option("aencoder", { type: "string", alias: "E" })
            .option("audio-copy-mask", { type: "string" })
            .option("audio-fallback", { type: "string" })
            .option("ab", { type: "string", alias: "B" })
            .option("aq", { type: "string", alias: "Q" })
            .option("ac", { type: "string", alias: "C" })
            .option("mixdown", { type: "string", alias: "6" })
            .option("arate", { type: "string", alias: "R" })
            .option("drc", { type: "float", alias: "D" })
            .option("gain", { type: "float" })
            .option("aname", { type: "string", alias: "A" })
        .subgroup("picture")            
            .option("width", { type: "number", alias: "w" })
            .option("height", { type: "number", alias: "l" })
            .option("crop", { type: "string" })
            .option("loose-crop", { type: "number" })
            .option("maxHeight", { type: "number", alias: "Y" })
            .option("maxWidth", { type: "number", alias: "X" })
            .option("strict-anamorphic", { type: "boolean" })
            .option("loose-anamorphic", { type: "boolean" })
            .option("custom-anamorphic", { type: "boolean" })
            .option("display-width", { type: "number" })
            .option("keep-display-aspect", { type: "boolean" })
            .option("pixel-aspect", { type: "string" })
            .option("itu-par", { type: "boolean" })
            .option("modulus", { type: "number" })
            .option("color-matrix", { type: "string", alias: "M" })
        .subgroup("filters")
            .option("deinterlace", { type: "string", alias: "d" })
            .option("decomb", { type: "string", alias: "5" })
            .option("detelecine", { type: "string", alias: "9" })
            .option("denoise", { type: "string", alias: "8" })
            .option("deblock", { type: "string", alias: "7" })
            .option("rotate", { type: "number" })
            .option("grayscale", { type: "boolean", alias: "g" })
        .subgroup("subtitle")
            .option("subtitle", { type: "string", alias: "s" })
            .option("subtitle-forced", { type: "number" })
            .option("subtitle-burn", { type: "number" })
            .option("subtitle-default", { type: "number" })
            .option("native-language", { type: "string", alias: "N" })
            .option("native-dub", { type: "boolean" })
            .option("srt-file", { type: "string" })
            .option("srt-codeset", { type: "string" })
            .option("srt-offset", { type: "string" })
            .option("srt-lang", { type: "string" })
            .option("srt-default", { type: "number" })
    .parseConfigFile({
        onInvalidJSON: function(err, configPath){
            veelo.emit(
                "warning", 
                "Fatal error parsing config: " + err + 
                "\nPlease ensure this config file is valid JSON: " + configPath
            );
        }
    });

/**
 track statistics for use in reports
 @property stats
 @type {Object}
*/
veelo.stats = _stats;
veelo.jobs = _jobs;


/**
Cancels queue processing. Used by --dry-run.
@method cancel
*/
veelo.cancel = function(){
    _isCancelled = true;
};

/**
get dry-run report
@method getReport
*/
veelo.getReport = function(){
    var output = "";
    function addLine(){
        output += util.format.apply(this, arguments);
        output += "\n";
    }
    if (_stats.jobs.valid > 0){
        addLine("\nThe following input files will be", "processed:".strong, "\n");
        _jobs.valid.forEach(function(job){
            addLine(job.path.input);
        });

        addLine("\n%s will land in these directories:", "output".strong);
        var distinctDirs = [];
        _jobs.valid.forEach(function(job){
            distinctDirs.push(path.dirname(job.path.output));
        })
        distinctDirs = _.uniq(distinctDirs);
        distinctDirs.forEach(function(dir){
            addLine(dir);
        });
        
        if (config.get("archive")){
            addLine("\nThe input files will be %s to these directories: ", "archived".strong);
            distinctDirs = [];
            _jobs.valid.forEach(function(job){
                distinctDirs.push(path.dirname(job.path.archive));
            });
            distinctDirs = _.uniq(distinctDirs);
            distinctDirs.forEach(function(dir){
                addLine(dir);
            });
        }
    }
        
    if (_stats.jobs.invalid > 0){
        addLine("\nThe following files are %s", "invalid:".strong);
        _jobs.invalid.forEach(function(job){
            addLine(job.path.input);
        });
    }
            
    return output;
}

/**
used by veelo.add, with --recurse set
@method expandFileList
@private
*/
function expandFileList(filePaths){
    // Recurse mode
    var output = [],
        self = this;
        
    filePaths.forEach(function(filePath){
        if (fs.existsSync(filePath)){
            if (fs.statSync(filePath).isDirectory()){
                var dirListing = fs.readdirSync(filePath).map(function(file){
                    return path.join(filePath, file);
                });
                output = output.concat(expandFileList(dirListing));
            } else {
                try{
                    if (fileShouldBeIncluded(filePath, config.get("include"), config.get("exclude"))){
                        output.push(filePath);
                    }
                } catch (err){
                    self.emit(e.error, err);
                }
            }
        } else {
            self.emit(e.msg, "file does not exist: " + filePath);
        }

    });
    return output;
}

function fileShouldBeIncluded(relativePath, include, exclude){
    // defaults 
    var included = true, 
        excluded = false;

    // exclude expression passed
    if (exclude){
        var exclude = new RegExp(exclude, "i");
        excluded = exclude.test(relativePath);
    }

    // include expression passed
    if (include){
        var include = new RegExp(include, "i");
        included = include.test(relativePath);
    }

    if(included && !excluded) return true;
}

/**
Command-based interface
@method execute
@example
    var queue = veelo.execute("encode", ["Tons of wood.mov", "Tons of stone.mov"], { preset: "Normal" });
*/
veelo.execute = function(command){};

/**
Encode a file or files
@method encode
@return {Queue}
@example
    var queue = veelo.encode(["Rawhide 1.wmv", "Rawhide 2.wmv"], { preset: "Normal" });
    queue.on("progress", function(progress){
        console.log(progress.percentComplete);
    });
*/
veelo.encode = function(files, options){
    
};

/**
@method info
@return {Array}
@example 
Return info on all files beneath the "Music" directory:

    var info = veelo.info(["Music"], { recurse: true });
@example
Returns info formatted as HTML strings:

    var info = veelo.info(["Tales of the Unexpected.avi"], { html: true });
@example
Print the config definition for this method: 

    console.log(veelo.info.config.toJSON());

*/
veelo.info = function(files, options){};

/**
@method help
@return {String}
@example
    console.log(veelo.help("Picture"));
*/
veelo.help = function(topic){};

/**
Manage user defaults (stored in `~/.veelo.json`)
@method defaults
@chainable
@example
    veelo.config.add("srt-lang", "English")
                .remove("preset", "Android")
                .list();
*/
veelo.defaults = function(){};

/**
Preset Management
@method preset
@chainable
@example
    veelo.preset.set("my phone", { rotate: 3, quality: 25 });
    veelo.preset.remove("preset");
    veelo.preset.list();
*/
veelo.preset = function(){};

/**

@method split
@return {Queue}
@example
    var queue = veelo.split("Goodbye Uncle Tom.avi", 900, { preset: "Normal" });
*/
veelo.split = function(){};

/**
@method collage
@return {Queue}
@example
    var queue = veelo.collage("Films", 2, { recurse: true });
*/
veelo.collage = function(){};


module.exports = veelo;

