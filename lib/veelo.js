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
    cm = require("../../config-master"),
    work = require("../../work"),
    handbrake = require("../../handbrake-js"),
    general = require("../../general");

/**
Synopsis:

    var veelo = require("veelo");
    
    veelo.encode({ files: ["Oh ffs.wmv", "Doc off.avi"], preset: "Normal" })
         .on("starting", function(stats){
             console.log("%d encodes queued. File types: %s")
         })
         .on("progress", function(progress){
             console.log("%d% complete", progress.percentComplete);
         })
         .on("complete", function(stats){
             console.log("%d encodes complete: %d success, %d fail. ");
         });
    
@class veelo
@static
*/

var configs = new cm.Configs(),
    Config = cm.Config,
    Job = work.Job,
    Queue = work.Queue;

// define config
configs.add(
    "files",
    new Config()
        .define({
            name: "files", 
            type: Array,
            required: true,
            defaultOption: true,
            valid: function(files){
                var self = this;
                return files.every(function(file){
                    if (fs.existsSync(file)){
                        return true;
                    } else {
                        self.addValidationMessage("file doesn't exist: " + file);
                        return false;
                    }
                });
            }
        })
        .define({ name: "recurse", type: "boolean" })
        .define({ name: "include", type: RegExp, typeFailMsg: "please pass a valid regular expression" })
        .define({ name: "exclude", type: RegExp, typeFailMsg: "please pass a valid regular expression" })
        .define({ name: "ignoreList", type: Array })
);
configs.add(
    "encode-job",
    new Config()
        .define({ name: "ext", type: "string", valid: /^(mp4|m4v|mkv)$/, default: "m4v" })
        .define({ name: "archive", type: "boolean" })
        .define({ name: "archive-directory", type: "string", default: "veelo-originals" })
        .define({ name: "output-dir", type: "string", valid: function(dir){
            var sameAsArchiveDir = path.resolve(dir) === path.resolve(this.config.get("archive-directory"));
            if (sameAsArchiveDir){
                this.addValidationMessage("Archive and Output directories must be different");
            }
            return !sameAsArchiveDir;
        }})
        .define({ name: "embed-srt", type: "boolean" })
        .define({ name: "preserve-dates", type: "boolean", alias: "p" })
        .define({ name: "user-defined-presets", type: "object" })
);
configs.add("handbrake", handbrake.run.config.where({
    name: { $ne: ["preset-list", "help", "scan", "title" ] }
}));
configs.add(
    "common", 
    new Config()
        .define({ name: "dry-run", type: "boolean" })
        // .define({ name: "verbose", type: "boolean", alias: "v" })    
);

/**
Encode a file or files
@method encode
@param {Array} files The files to encode
@param {Config} [options]
@return {EncodeQueue}
@example
    var queue = veelo.encode(["Rawhide 1.wmv", "Rawhide 2.wmv"], { preset: "Normal" });
    queue.on("progress", function(progress){
        console.log(progress.percentComplete);
    });
*/
exports.encode = function(options){
    var config = configs
        .add("encode", [ "files", "encode-job", "handbrake", "common" ])
        .get("encode", options);
    var queue = new Queue({ name: "VEELO ENCODE QUEUE" });

    process.nextTick(function(){
        if (!config.isValid){
            config.errors.forEach(function(error){
                queue.emit("error", error);
            });
        } else {
            var files = config.get("files");
            files = general.expandFileList(files, config.get("include"), config.get("exclude"));
            files.forEach(function(file){
                // also check ignore list
                var fileStats = fs.statSync(file);
                if (fileStats.isFile()){
                    var outputBaseName = general.replaceFileExtension(file, config.get("ext"));
                    var path = {
                        input: file, 
                        working: general.getTempFilePath(outputBaseName),
                        archive: config.get("archive") 
                            ? general.getSubDirPath(file, config.get("archive-directory"))
                            : "",
                        output: general.getSafePath(
                            config.hasValue("output-dir") 
                                ? getOutputPath(config.get("output-dir"), outputBaseName)
                                : outputBaseName
                        )
                    };
                    
                    // Encode Job
                    var encodeJob = new Job({
                        name: "Encode",
                        command: encodeCommand,
                        args: [
                            path.input, 
                            path.working, 
                            config.where({ group: "handbrake" }).toJSON(),
                            config.get("embed-srt"), 
                            config.get("verbose")
                        ],
                        data: { file: path.input }
                    });

                    // encode fail jobs
                    var undoJob = new Job({
                        name: "Undo",
                        commandSync: general.deleteFile,
                        args: path.working,
                        data: { file: path.input }
                    });
                    encodeJob.onFail.add(undoJob);
                    encodeJob.onTerminate.add(undoJob);

                    // Archive Job
                    if (path.archive){
                        var archiveJob = new Job({
                            name: "Archive to",
                            async: true, 
                            command: function(){ 
                                var self = this;
                                general.moveFile({ from: path.input, to: path.archive }, function(){
                                    self.emitSuccess();
                                }); 
                            },
                            data: { file: path.archive }
                        });
                        encodeJob.onSuccess.add(archiveJob);
                    }

                    // Place Output Job
                    var copyJob = new Job({
                        name: "Move to",
                        command: function(){ 
                            var self = this;
                            general.moveFile({
                                from: path.working, 
                                to: path.output,
                                safe: false
                            }, function(){
                                self.emitSuccess();
                            });
                        },
                        data: { file: path.output }
                    });
                    encodeJob.onSuccess.add(copyJob);
                    
                    // Preserve Dates Job
                    if(config.get("preserve-dates")){
                        var pdJob = new Job({
                            name : "Preserve Dates to",
                            command: function(){
                                general.preserveDates(fileStats, path.output);
                                fs.utimesSync(path.output, fileStats.atime, fileStats.mtime);
                                this.emitSuccess();
                            },
                            data: { file: path.output }
                        });
                        encodeJob.onSuccess.add(pdJob);
                    }
                    
                    queue.add(encodeJob);
                }
            });
    
            if (config.get("dry-run")){
                queue.emitInfo(queue.distinctExts());
                queue.emitInfo("The following input files will be processed\n");

                queue.jobs.forEach(function(job){
                    queue.emitInfo(job.data.path.input);
                });

                queue.emitInfo("\noutput will land in these directories:");
                var distinctDirs = [];
                queue.jobs.forEach(function(job){
                    distinctDirs.push(path.dirname(job.data.path.output));
                });
                distinctDirs = _.uniq(distinctDirs);
                distinctDirs.forEach(function(dir){
                    queue.emitInfo(dir);
                });
        
                if (config.get("archive")){
                    queue.emitInfo("\nThe input files will be archived to these directories: ");
                    distinctDirs = [];
                    queue.jobs.forEach(function(job){
                        distinctDirs.push(path.dirname(job.data.path.archive));
                    });
                    distinctDirs = _.uniq(distinctDirs);
                    distinctDirs.forEach(function(dir){
                        queue.emitInfo(dir);
                    });
                }
            } else {
                // queue.print();
                queue.start();
            }
        }
    });
    
    queue.distinctExts = function(){
        var output = {};
        this.jobs.forEach(function(job){
            var ext = path.extname(job.data.file).toLowerCase();
            if (output[ext]){
                output[ext]++;
            } else {
                output[ext] = 1;
            }
        });
        return output;
    }
    return queue;
};

function encodeCommand(inputFile, outputFile, handbrakeOptions, embedSrt, verbose){
    var job = this;
    
    // embed subtitles
    var srtPath = inputFile.replace(/\.\w+$/, "." + "srt");
    if (embedSrt && fs.existsSync(srtPath)){
        handbrakeOptions["srt-file"] = srtPath;
        job.emitInfo("embedding external subs: " + srtPath);
    }
        
    handbrakeOptions.i = inputFile;
    handbrakeOptions.o = outputFile;
    
    // handbrake-job adapter
    handbrake.run(handbrakeOptions)
        .on("progress", function(progress){ job.emitProgress(progress); })
        .on("terminated", function(){ job.emitTerminated(); })
        .on("complete", function(timer){ job.emitSuccess(timer); })
        .on("output", function(data){ verbose && job.emitInfo(data); })
        .on("error", function(err){ job.emitError(err); });
}

/**
@method info
@param {Object} options 
@return {Queue} a Queue
@example 
Return info on all files beneath the "Music" directory:

    veelo.info({ files: ["Music"], recurse: true })
        .on("info", function(info){
            console.log(info);
        })
*/
exports.info = function(options){
    var config = configs
        .add("info", [ "files", "common" ])
        .get("info", options);
    
    var files = config.get("files"),
        queue = new Queue({ name: "Infos"});

    process.nextTick(function(){
        files.forEach(function(file){
            var job = new Job({ name: "get info for: " + file });
            job.command = function(){
                var self = this;
                handbrake.run({ i: file, scan: true}, function(stdout, stderr){
                    var info = { audioTracks: [], subtitleTracks: [] },
                        audioLines = false,
                        subtitleLines = false;
                    stderr.split("\n").forEach(function(line){
                        var stream = line.match(/\+ stream: (.*)/);
                        if (stream) info.stream = stream[1];

                        var duration = line.match(/\+ duration: (.*)/);
                        if (duration) info.duration = duration[1];

                        var size = line.match(/\+ size: (.*)/);
                        if (size) info.size = size[1];

                        if (audioLines && !subtitleLines){
                            var audio = line.match(/    \+ (.*)/);
                            if (audio) info.audioTracks.push(audio[1]);
                        }
                        if (subtitleLines){
                            var sub = line.match(/    \+ (.*)/);
                            if (sub) info.subtitleTracks.push(sub[1]);
                        }
                        if (!audioLines){
                            audioLines = line.search(/audio tracks/) != -1;
                        } else if (audioLines && !subtitleLines){
                            subtitleLines = line.search(/subtitle tracks/) != -1;
                        }
                        
                    })
                    self.emitInfo(info);
                    self.emitSuccess();
                });
            };
            queue.add(job);
        });
        
        if (config.get("dry-run")){
            queue.print();
        } else {
            queue.start();
        }
    });
    
    return queue;
};


/**
@method help
@param {Object} options 
@param {Object} options.topic 
@param {Function} onComplete
@example
    veelo.help("Picture", function(help){
        console.log(help);
    });
*/
exports.help = function(options, done){
    var config = new Config()
        .define({ 
            name: "topic", 
            type: "string", 
            valid: /^(commands|encode|info|handbrake)$/, 
            default: "commands", 
            defaultOption: true 
        })
        .set(options);

    switch(config.get("topic")){
        case "commands": 
            done(help.commands);
            break;
        case "encode":
            done(help.encode);
            break;
        case "handbrake":
            var output = "";
            handbrake.run({ h: true }, function(stdout, stderr){
                output += stdout.replace(/^.*$\n\n/m, "");
                done(output);
            });
            break;
        default:
            done(config.get("topic"));
    }
};

var help = {};
help.commands =
"\nPlease pass one of the following commands, or type `veelo help <command>`\n\n" +
"Commands\n" +
"--------\n" +
"help: Get this help\n" +
"encode: Encode one or more video files\n" + 
"info: View info\n" + 
"defaults: Manage default options\n" + 
"preset: Preset management\n";

help.encode =
"\nusage: veelo encode [options] [HandbrakeCLI options] files\n\n" +
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
"        --version              Show version info\n";

/**
Manage user defaults (stored in `~/.veelo.json`)
@method defaults
@param {Object} options 
@param {Object} options.add
@param {Object} options.remove
@chainable
@example
    veelo.defaults
        .add("srt-lang", "English")
        .remove("preset", "Android")
        .list();
*/
configs.add(
    "crud",
    new Config()
        .define({ name: "add", type: "string", alias: "a" })
        .define({ name: "value", type: "string", defaultOption: true })
        .define({ name: "remove", type: "string", alias: "r" })
        .define({ name: "set", type: "string" })
        .define({ name: "list", type: "boolean" })
);
configs.add("defaults", "crud");
exports.defaults = function(options){
    var config = configs.apply("crud", options);    
};

/**
Preset Management
@method preset
@chainable
@example
    veelo.preset.set("my phone", { rotate: 3, quality: 25 });
    veelo.preset.remove("preset");
    veelo.preset.list();
*/
configs.add("preset", "crud");
exports.preset = function(options){
    var config = configs.apply("crud", options);
};

/**

@method split
@return {Queue}
@example
    var queue = veelo.split({ files: ["Goodbye Uncle Tom.avi"], length: 900, preset: "Normal" });
*/
configs.add(
    "splitSpecific",
    new Config()
        .define({ name: "length", type: "number" })
);
configs.add("split", ["files", "splitSpecific", "handbrake"]);
exports.split = function(options){
    var config = configs.get("split", options);
    
    config.get("files").forEach(function(file){
        
    });
};

/**
@method collage
@return {Queue}
@example
    var queue = veelo.collage("Films", 2, { recurse: true });
*/
exports.collage = function(){};

function version(){
    var packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8"));
    return packageJson.version
}

function getOutputPath(outputDir, file){
    var outputDir = outputDir.trim(),
        outputPath = "";

    // specific path specified
    if (/^\.\//.test(outputDir) || /^\//.test(outputDir) || /\.\.\//.test(outputDir)){
        outputPath = path.join(outputDir, file);

    // subdir path relative of input file
    } else {
        outputPath = general.getSubDirPath(file, outputDir);
    }
    return outputPath;
}
