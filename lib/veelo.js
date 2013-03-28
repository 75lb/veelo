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
    work = require("../../work"),
    handbrake = require("handbrake-js"),
    general = require("more-fs"),
    nature = require("nature"), Thing = nature.Thing,
    thing = require("./thing"),
    job = require("./job");

function l(msg){
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(this, args);
}

/**
Synopsis:

    var veelo = require("veelo");
    
    veelo.encode({ files: ["Oh ffs.wmv", "Doc off.avi"], preset: "Normal" })
         .on("queue-starting", function(queue){
             console.log("%d encodes queued.", queue.jobs.length );
         })
         .on("job-progress", function(job, progress){
             console.log("%d% complete", progress.percentComplete);
         })
         .on("queue-complete", function(queue){
             console.log("%d encodes complete: %d success, %d fail. ");
         });
    
@class veelo
@static
*/

var Job = work.Job;

// shared config sets
var fileList = new thing.FileList();
var commonThing = new thing.CommonOptionSet();
var crudThing = new thing.CrudOptionSet();

/**
Encode a file or files
@method encode
@param {Object|Thing} options
@return {Queue}
@example
    veelo.encode({ files: ["Rawhide 1.wmv", "Rawhide 2.wmv"], preset: "Normal" })
        .on("job-progress", function(job, progress){
            console.log(progress.percentComplete);
        });
*/
exports.encode = function(options){
    var config = new thing.EncodeOptionSet().set(options),
        queue = new Job({ name: "Encode Queue" });

    process.nextTick(function(){
        if (!config.valid){
            config.errors.forEach(function(error){
                queue.emit("error", error);
            });
        } else {
            var files = config.get("files");
            if (config.recurse){
                files = general.expandFileList(files, config.get("include"), config.get("exclude"));
            }
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
                        output: config.hasValue("output-dir") 
                            ? getOutputPath(config.get("output-dir"), outputBaseName)
                            : outputBaseName
                    };

                    // Encode Job
                    var encodeJob = new job.EncodeJob(config, path);

                    // onfail / terminate
                    var undoJob = new job.DeleteJob("Undo", path.working);
                    encodeJob.add(undoJob, "fail");
                    encodeJob.add(undoJob, "terminated");

                    // onSuccess
                    // Archive 
                    if (path.archive){
                        var archiveJob = new job.MoveJob("Archive to", path.input, path.archive);
                        encodeJob.add(archiveJob, "success");
                    }

                    // Place Output
                    var saveJob = new job.MoveJob("Save to", path.working, path.output);
                    encodeJob.add(saveJob, "success");
                    
                    // Preserve Dates
                    if(config.get("preserve-dates")){
                        saveJob.add({
                            name : "Preserve Dates to",
                            commandSync: function(){
                                general.preserveDates(fileStats, this.parent.parent.retVal);
                            },
                            data: { file: path.output }
                        }, "success");
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
                queue.run();
            }
        }
    });
    
    queue.distinctExts = function(){
        var output = {};
        this.children.forEach(function(job){
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
    var config = new Thing()
        .mixIn(fileList)
        .mixIn(commonThing)
        .set(options);
    
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
    var config = new Thing()
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
exports.defaults = function(options){
    var config = crudThing.clone().set(options);
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
exports.preset = function(options){
    var config = crudThing.clone().set(options);
};

/**

@method split
@return {Queue}
@example
    var queue = veelo.split({ files: ["Goodbye Uncle Tom.avi"], length: 900, preset: "Normal" });
*/
exports.split = function(options){
    var config = new Thing()
        .define({ name: "length", type: "number" })
        .mixIn(fileList)
        .mixIn(handbrake.run.config, "handbrake")
        .set(options);
    
    config.get("files").forEach(function(file){
        
    });
};

/**
@method collage
@return {Queue}
@example
    var queue = veelo.collage({ files: ["Films"], recurse: true, clipLength: 2 });
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
