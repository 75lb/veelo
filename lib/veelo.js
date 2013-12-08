"use strict";
var Job = require("work").Job,
    handbrake = require("handbrake-js"),
    Thing = require("nature").Thing,
    thing = require("./thing"),
    l = console.log; /* exported l */

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

// shared config sets
var fileList = new thing.FileList();
var commonThing = new thing.CommonOptionSet();

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
        queue = new Job({ name: "Infos"});

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
                        
                    });
                    self.inform(info);
                    self.success();
                });
            };
            queue.add(job);
        });
        
        if (config.get("dry-run")){
            queue.print();
        } else {
            queue.run();
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
            handbrake.run({ h: true }, function(stdout){
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
// exports.defaults = function(options){
//     var config = crudThing.clone().set(options);
// };

/**
Preset Management
@method preset
@chainable
@example
    veelo.preset.set("my phone", { rotate: 3, quality: 25 });
    veelo.preset.remove("preset");
    veelo.preset.list();
*/
exports.preset = function(){
};

/**
@method collage
@return {Queue}
@example
    var queue = veelo.collage({ files: ["Films"], recurse: true, clipLength: 2 });
*/
exports.collage = function(){};
