// module dependencies
var fs = require("fs"),
    path = require("path"),
    os = require("os"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    fse = require("fs-extra"),
    HandbrakeCLI = require("./handbrakeCli");

// exposed API
module.exports = Job;

// privates
var _config;

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
function Job(config, inputPath){
    _config = config;

    var self = this,
        options = _config.options;

    this.valid = null;
    this.inputPath = inputPath;
    this.archivePath = getArchivePath(
        this.inputPath,
        options.veelo.archive,
        options.veelo.archiveDirectory
    );
    this.outputPath = getOutputPath(
        this.inputPath, 
        options.veelo["output-dir"], 
        options.veelo.ext
    );
    
    this.workingPath = replaceFileExtension(
        path.join(
            os.tmpDir(),
            ".processing." + path.basename(this.inputPath)
        ), 
        options.veelo.ext
    );
    this.completed = false;
    this.successful = false;
    
    this.on("success", function(){
        self.completed = true;
        self.successful = true;
    });
    this.on("fail", function(){
        self.completed = true;
    });
};

Job.prototype = new EventEmitter();

Job.prototype.init = function(){
    var self = this,
        file = this.inputPath;

    if(!fs.existsSync(file)){
        this.valid = false;
        this.emit(e.invalid, "validation failed, file does not exist: " + file.fileName);
    } else if(!fs.statSync(file).isFile()){
        this.valid = false;
        var msg = "validation failed, not a video file: " + file.fileName;
        if (fs.statSync(file).isDirectory()){
            msg += "\nTip: to process a directory, pass --recurse"
        }
        this.emit(e.invalid, msg);
    } else if (fileIgnored(file, _config.options.veelo.ignoreList)){
        this.valid = false;
    } else{
        this.valid = true;
        this.emit(e.valid);
    }
};

Job.prototype.process = function(){
    var self = this,
        options = _config.options;
        
    if (!this.valid) throw "attempt to process an invalid file";
    
    options.handbrake.i = this.inputPath;
    options.handbrake.o = this.workingPath;

    // embed subtitles
    var srtPath = this.inputPath.replace(/\.\w+$/, "." + "srt");
    if (options.veelo["embed-srt"] && fs.existsSync(srtPath)){
        options.handbrake["srt-file"] = srtPath;
        this.emit(e.msg, "embedding external subs: " + srtPath);
    }

    var handbrakeCLI = new HandbrakeCLI();
    handbrakeCLI.on("handbrake-output", function(data){
        self.emit(e.hbOp, data);
    });
    handbrakeCLI.on("fail", function(){
        self.emit(e.fail);
    });
    handbrakeCLI.on("terminated", function(){
        fs.unlink(self.workingPath);
    });
    handbrakeCLI.on("success", function(){
        // move input to archive
        if (options.veelo.archive){
            var archiveDir = path.dirname(self.archivePath);
            if (!fs.existsSync(archiveDir)){
                fs.mkdirSync(archiveDir);
            }
            self.archivePath = checkSafePath(self.archivePath);
            fs.renameSync(self.inputPath, self.archivePath);
            
        // create output-dir
        } else if (options.veelo["output-dir"]){
            var dir = path.dirname(self.outputPath);
            if (!fs.existsSync(dir)){
                fse.mkdirsSync(dir);
            }
        }

        if (fs.existsSync(self.workingPath)){
            self.outputPath = checkSafePath(self.outputPath);
            fse.copy(self.workingPath, self.outputPath, function(err){
                if (err) throw err;
                fs.unlinkSync(self.workingPath);                
                if(options.veelo["preserve-dates"]){
                    var inputFileStats = fs.statSync(options.veelo.archive ? self.archivePath : self.inputPath);
                    fs.utimesSync(self.outputPath, inputFileStats.atime, inputFileStats.mtime);
                }
            })
        }

        self.emit(e.success);
    });
    
    this.emit(e.processing, this.inputPath);
    handbrakeCLI.spawn(options.handbrake, options.veelo.v || options.veelo.verbose);
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

// function minimumConfig(config){
//     config.archiveDirectory = config.archiveDirectory || "veelo-originals";
//     config.options.veelo.ext = config.options.veelo.ext || "m4v";
//     return config;
// }