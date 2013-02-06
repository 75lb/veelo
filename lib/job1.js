// module dependencies
var fs = require("fs"),
    path = require("path"),
    os = require("os"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    _ = require("underscore"),
    fse = require("fs-extra"),
    config = require("./config"),
    shared = require("../test/shared"),
    handbrake = require("./handbrake");

var e = {
    /**
    @event starting
    */
    starting: "starting",
    /**
    @event progress
    */
    progress: "progress", 
    /**
    @event complete
    */
    complete: "complete",
    /**
    @event info
    */
    info: "info",
    /**
    @event warning
    */
    warning: "warning",
    /**
    @event error
    */
    error: "error"
};

/**
@class Job1
@constructor
@param {String} inputFile
@param {Config} encoderConfig
@param {Config} jobOptions
*/
function Job(inputFile, encoderConfig, jobOptions){
    _encoderConfig = encoderConfig;
    _jobConfig = job.config(jobOptions);
    
    /**
    Stores `input`, `working`, `archive` and `output` paths
    @property path
    @type Object
    */
    this.path = computePaths(inputFile, jobOptions);
    
    /**
    Indicates whether the job passed validation
    @property valid
    @type Boolean
    */
    this.valid = validate(inputFile, jobOptions.ignoreList);
    /**
    Indicates whether the input file was on the ignore list
    @property ignored
    @type Boolean
    */
    this.ignored = ignored(inputFile, path);
}
Job.config = function(values){
    return new Config()
        .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", default: "m4v" })
        .option("archive", { type: "boolean" })
        .option("archiveDirectory", { type: "string", default: "veelo-originals" })
        .option("output-dir", { type: "string" })
        .option("ignoreList", { type: "array", default: [] })
        .option("embed-srt", { type: "boolean" })
        .option("verbose", { type: "boolean", alias: "v" })
        .option("preserve-dates", { type: "boolean" })
        .set(values);
};

Job.prototype = new EventEmitter();

/**
Runs the Encoder with the stored encoder options
@method run
@chainable
*/
Job.prototype.run = function(){
    var self = this;
    
    // embed subtitles
    var srtPath = this.path.input.replace(/\.\w+$/, "." + "srt");
    if (_jobConfig["embed-srt"] && fs.existsSync(srtPath)){
        _encoderConfig.set("srt-file", srtPath);
        this.emit(e.msg, "embedding external subs: " + srtPath);
    }
        
    _encoderConfig.i = this.path.input;
    _encoderConfig.o = this.path.working;
    this.emit(e.starting, self.path.input);
    
    handbrake.run(_encoderConfig)
        .on("starting", function(stats){
            self.emit("starting", stats);
        })
        .on("progress", function(progress){
            self.emit(e.progress, progress);
        })
        .on("output", function(data){
            _jobConfig.get("verbose") && self.emit(e.output, data);
        })
        .on("error", function(msg, options, output){
            self.emit(e.error, msg, options, output);
        })
        .on("terminated", function(){
            self.emit(e.info, "shutting down..");
            if (fs.existsSync(self.path.working)){
                self.emit(e.info, "cleaning up");
                fs.unlink(self.path.working);
            }
            self.emit(e.complete);
        })
        .on("complete", function(){
            // move input to archive
            if (_jobConfig.get("archive")){
                var archiveDir = path.dirname(self.path.archive);
                if (!fs.existsSync(archiveDir)){
                    fs.mkdirSync(archiveDir);
                }
                self.path.archive = checkSafePath(self.path.archive);
                fs.renameSync(self.path.input, self.path.archive);
                    
            // create output-dir
            } else if (_jobConfig.get("output-dir")){
                var dir = path.dirname(self.path.output);
                if (!fs.existsSync(dir)){
                    fse.mkdirsSync(dir);
                }
            }

            if (fs.existsSync(self.path.working)){
                self.path.output = checkSafePath(self.path.output);
                fse.copy(self.path.working, self.path.output, function(err){
                    if (err) throw err;
                    fs.unlinkSync(self.path.working);
                    if(_jobConfig.get("preserve-dates")){
                        var inputFileStats = fs.statSync(_jobConfig.get("archive") ? self.path.archive : self.path.input);
                        fs.utimesSync(self.path.output, inputFileStats.atime, inputFileStats.mtime);
                    }
                })
            }
        
            self.emit(e.complete);
        });
        
    return this;
};

Job.prototype._inject = function(dependencies){
    handbrake = dependencies.handbrake || handbrake;
    fs = dependencies.fs || fs;
};

function computePaths(inputPath, options){
    options = computePaths.config(options).toJSON();
    var output = {};
    
    if (inputPath){
        output.input = inputPath;
        output.archive = options.archive
            ? path.join(
                path.dirname(output.input), 
                options.archiveDirectory, 
                path.basename(output.input)
            )
            : "";
        output.output = getOutputPath(output.input, options["output-dir"], options.ext);
        output.working = replaceFileExtension(
            path.join(
                os.tmpDir(),
                ".processing." + path.basename(output.input)
            ), 
            config.get("ext")
        );
    }
    return output;
}

function replaceFileExtension(file, ext){
    return file.replace(/\.\w+$/, "." + ext);
}

function getOutputPath(inputPath, outputDir, ext){
    var outputPath = replaceFileExtension(inputPath, ext);

    // output directory
    if(outputDir){
        outputDir = outputDir.trim();
        if (/^\.\//.test(outputDir) || /^\//.test(outputDir) || /\.\.\//.test(outputDir)){
            outputPath = path.join(outputDir, outputPath);
        } else {
            outputPath = path.join(path.dirname(outputPath), outputDir, path.basename(outputPath));
        }
    }

    return outputPath;
}
function validate(inputFile){
    return fs.existsSync(inputFile) && fs.statSync(inputFile).isFile();
};
function ignored(inputFile, ignoreList){
    return ignoreList.some(function(ignoredFile){
        return path.basename(ignoredFile) == path.basename(inputFile); 
    });
}
function checkSafePath (path){
    if (fs.existsSync(path)){
        return checkSafePath(path.replace(/\.(\w+)$/, "_.$1"));
    } else {
        return path;
    }
};

module.exports = Job;
