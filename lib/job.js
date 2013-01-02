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
    HandbrakeCLI = require("./handbrakeCli");

// exposed API
module.exports = Job;

// emits
var e = {
    msg: "message",
    fail: "fail",
    success: "success",
    invalid: "invalid",
    valid: "valid",
    processing: "processing",
    hbOp: "handbrake-output"
};

// main class definition
function Job(settings){
    settings = _.defaults(settings || {}, { 
        inputPath: ""
    });
    
    var self = this;

    this.path = {};
    this.setInput(settings.inputPath);
    
    this.is = {
        valid: null,
        complete: false,
        successful: false
    };
    
    this.on("success", function(){
        self.is.complete = true;
        self.is.successful = true;
    });
    this.on("fail", function(){
        self.is.complete = true;
    });
};

Job.prototype = new EventEmitter();

Job.prototype.setInput = function(inputPath){
    // shared.log(config);
    if (inputPath){
        this.path.input = inputPath;
        this.path.archive = getArchivePath(
            this.path.input,
            config.get("archive"),
            config.get("archiveDirectory")
        );
        this.path.output = getOutputPath(
            this.path.input, 
            config.get("output-dir"), 
            config.get("ext")
        );
        this.path.working = replaceFileExtension(
            path.join(
                os.tmpDir(),
                ".processing." + path.basename(this.path.input)
            ), 
            config.get("ext")
        );
    }
};

Job.prototype.validate = function(){
    var self = this,
        file = self.path.input;

    if(!fs.existsSync(file)){
        this.is.valid = false;
        this.emit(e.invalid, "validation failed, file does not exist: " + file.fileName);
    } else if(!fs.statSync(file).isFile()){
        this.is.valid = false;
        var msg = "validation failed, not a video file: " + file.fileName;
        if (fs.statSync(file).isDirectory()){
            msg += "\nTip: to process a directory, pass --recurse"
        }
        this.emit(e.invalid, msg);
    } else if (fileIgnored(file, config.get("ignoreList"))){
        this.is.valid = false;
    } else{
        this.is.valid = true;
        this.emit(e.valid);
    }
};

Job.prototype.process = function(){
    var self = this;

    if (this.is.valid === null) this.validate();
    if (!this.is.valid) throw new Error("attempt to process an invalid file");
    
    // embed subtitles
    var srtPath = this.path.input.replace(/\.\w+$/, "." + "srt");
    if (config.get("embed-srt") && fs.existsSync(srtPath)){
        config.set("srt-file", srtPath);
        this.emit(e.msg, "embedding external subs: " + srtPath);
    }

    var handbrakeCLI = new HandbrakeCLI();
    handbrakeCLI.on("handbrake-output", function(data){
        self.emit(e.hbOp, data);
    });
    handbrakeCLI.on("fail", function(data){
        self.emit(e.fail, data);
    });
    handbrakeCLI.on("terminated", function(){
        self.emit(e.msg, "shutting down..");
        fs.unlink(self.workingPath);
    });
    handbrakeCLI.on("success", function(){
        // move input to archive
        if (config.get("archive")){
            var archiveDir = path.dirname(self.path.archive);
            if (!fs.existsSync(archiveDir)){
                fs.mkdirSync(archiveDir);
            }
            self.path.archive = checkSafePath(self.path.archive);
            fs.renameSync(self.path.input, self.path.archive);
            
        // create output-dir
        } else if (config.get("output-dir")){
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
                if(config.get("preserve-dates")){
                    var inputFileStats = fs.statSync(config.get("archive") ? self.path.archive : self.path.input);
                    fs.utimesSync(self.path.output, inputFileStats.atime, inputFileStats.mtime);
                }
            })
        }

        self.emit(e.success);
    });
    
    this.emit(e.processing, self.path.input);
    
    var handbrakeArgs = config.group("handbrake").toJSON();
    handbrakeArgs.i = this.path.input;
    handbrakeArgs.o = this.path.working;

    handbrakeCLI.spawn({
        handbrakeArgs: handbrakeArgs, 
        emitOutput: config.get("verbose")
    });
};

Job.prototype._inject = function(dependencies){
    HandbrakeCLI = dependencies.HandbrakeCLI || HandbrakeCLI;
}

// internal functions
function fileIgnored(file, ignoreList){
    return ignoreList.some(function(ignoredFile){
        return ignoredFile == path.basename(file); 
    });
}

function checkSafePath (path){
    if (fs.existsSync(path)){
        return checkSafePath(path.replace(/\.(\w+)$/, "_.$1"));
    } else {
        return path;
    }
};

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

function getArchivePath(inputPath, archive, archiveDir){
    if (archive){
        return path.join(path.dirname(inputPath), archiveDir, path.basename(inputPath));
    } else {
        return "";
    }
}

function replaceFileExtension(file, ext){
    return file.replace(/\.\w+$/, "." + ext);
}
