"use strict";
var Job = require("work").Job,
    handbrake = require("handbrake-js"),
    Thing = require("nature").Thing,
    thing = require("./thing"),
    l = console.log; /* exported l */
/**
@method info
@param {Object} options 
@return {Queue} a Queue
@example 
Return info on all files beneath the "Music" directory:

    info({ files: ["Music"], recurse: true })
        .on("info", function(info){
            console.log(info);
        })
*/
module.exports = function(options){
    var config = new Thing()
        .mixIn(thing.fileList)
        .mixIn(thing.commonThing)
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
