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
    HandbrakeCLI = require("./handbrakeCli"),
    config = require("./config"),
    shared = require("../test/shared"),
    Job = require("./job");
    
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
    @event handbrake-output
    */
    hbOp: "handbrake-output",
    
    /**
    @event begin
    */
    begin: "begin",
    
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
    jobFail: "job-fail"
};

// if set to true, queue will not process
var _isCancelled = false;

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

veelo.on("handbrake-output", function(hbOp){
    if (/Encoding:/.test(hbOp)){
        var match = hbOp.match(/task 1 of 1, (.*) %( \((.*?) fps, avg (.*?) fps, ETA (.*?)\))?/);
        veelo.emit("job-progress", {
            percentComplete: match[1],
            fps: +match[3],
            avgFps: +match[4],
            eta: match[5]
        });
    }
});

/**
 Add a file or array of files to the queue.
 @method add
 @param {String|Array} file The file, or files to add
 @chainable
*/
veelo.add = function add(files){
    var self = this,
        stats = this.stats,
        jobs = this.jobs;
    
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
            stats.invalid++;
            jobs.invalid.push(job);
            self.emit(e.msg, msg);
        });
        job.on("valid", function(){
            stats.valid++;
            var ext = path.extname(job.path.input).toLowerCase();
            stats.ext[ext] = (stats.ext[ext] || 0) + 1;
            jobs.valid.push(job);
        });
        job.on("processing", function(file){
            self.emit(e.processing, file);
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
    initQueue();
    return veelo;
};

/**
 Start processing.
 @method start
 @chainable
*/
veelo.start = function start(){
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
        var handbrakeCLI = new HandbrakeCLI();
        handbrakeCLI.exec({ handbrakeArgs: config.group("handbrake").toJSON() }, function(stdout, stderr){
            veelo.emit("message", stdout + stderr);
        });

    // user passes files
    } else if (veelo.stats.valid > 0){

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
            var self = this,
                stats = this.stats;
            if (this.jobs.valid.length > 0){
                this.emit(e.begin);
        
                function processNext(jobs){
                    var job = jobs.shift();
                    if (job && !_isCancelled){
                        job.on("success", function(){
                            stats.successful++;
                            processNext(jobs);
                        });
                        job.on("fail", function(data){
                            stats.failed++;
                            self.emit(e.jobFail, data);
                            processNext(jobs);
                        });
                        job.on("message", function(msg){
                            self.emit(e.msg, msg);
                        });
                        job.on("handbrake-output", function(msg){
                            self.emit(e.hbOp, msg);
                        });
                        job.process();
                    } else {
                        self.emit(e.complete);
                    }
                }
                processNext(this.jobs.valid);
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
For testing purposes
@private
@method _inject
@param {Queue} MockQueue
*/
veelo._inject = function _inject(MockQueue){
    Queue = MockQueue;
    initQueue();
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
        var handbrakeCLI = new HandbrakeCLI();
        handbrakeCLI.exec({ handbrakeArgs: { h: true }}, function(stdout, stderr){
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
veelo.stats = {
    start: null, end: null, elapsed: "",
    valid: 0, invalid: 0,
    ignored: 0,    
    failed: 0, successful: 0,
    ext: {}
};

veelo.jobs = {
    /**
    Valid Jobs
    @property jobs.valid
    @type {Array}
    */
    valid: [],
        
    /**
    list containing invalid jobs
    @property jobs.invalid
    @type {Array}
    */
    invalid: [],
        
    /**
    list of failed jobs. 
    @property jobs.failed
    @type {Array}
    */
    failed: function(){
        return jobs.valid.filter(function(job){
            return job.is.complete && job.is.successful === false; 
        });
    },

    /**
    list of successful jobs. 
    @property jobs.successful
    @type {Array}
    */
    successful: function(){
        return jobs.valid.filter(function(job){
            return job.is.complete && job.is.successful === true; 
        });
    }
};

// when processing begins, record the 'start' time
veelo.on("begin", function(){
    veelo.stats.start = Date.now();
});    

// on processing completion, record the 'end' and 'elapsed' times
veelo.on("complete", function(){
    veelo.stats.end = Date.now();
    var elapsed = new Date(veelo.stats.end - veelo.stats.start),
        hours = elapsed.getHours(),
        minutes = elapsed.getMinutes(),
        seconds = elapsed.getSeconds();
    veelo.stats.elapsed = 
        (hours ? hours + "h ": "") + 
        (minutes ? minutes + "m " : "") + 
        (seconds ? seconds + "s" : "0s");
});

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
    if (this.stats.valid > 0){
        addLine("\nThe following input files will be", "processed:".strong, "\n");
        this.jobs.valid.forEach(function(job){
            addLine(job.path.input);
        });

        addLine("\n%s will land in these directories:", "output".strong);
        var distinctDirs = [];
        this.jobs.valid.forEach(function(job){
            distinctDirs.push(path.dirname(job.path.output));
        })
        distinctDirs = _.uniq(distinctDirs);
        distinctDirs.forEach(function(dir){
            addLine(dir);
        });
        
        if (config.get("archive")){
            addLine("\nThe input files will be %s to these directories: ", "archived".strong);
            distinctDirs = [];
            this.jobs.valid.forEach(function(job){
                distinctDirs.push(path.dirname(job.path.archive));
            });
            distinctDirs = _.uniq(distinctDirs);
            distinctDirs.forEach(function(dir){
                addLine(dir);
            });
        }
    }
        
    if (this.stats.invalid > 0){
        addLine("\nThe following files are %s", "invalid:".strong);
        this.jobs.invalid.forEach(function(job){
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

module.exports = veelo;