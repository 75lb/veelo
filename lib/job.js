"use strict";

var fs = require("fs"),
    util = require("util"),
    handbrake = require("handbrake-js"),
    mfs = require("more-fs"),
    Job = require("work").Job,
    l = console.log; /* exported l */

var EncodeJob = exports.EncodeJob = function(config, path){
    Job.call(this, {
        name: "Encode " + path.input.substr(0, 20),
        command: encodeCommand,
        args: [
            path.input, 
            path.working, 
            config.where({ group: "handbrake" }).toJSON(),
            config.get("embed-srt"), 
            config.get("verbose")
        ],
        data: { 
            file: path.input,
            path: path
        }
    });
}
util.inherits(EncodeJob, Job);

var DeleteJob = exports.DeleteJob = function(name, file){
    Job.call(this, {
        name: name,
        commandSync: mfs.deleteFile,
        args: file,
        data: { file: file }
    });
}
util.inherits(DeleteJob, Job);

var MoveJob = exports.MoveJob = function(name, from, to){
    Job.call(this, {
        name: name,
        command: function(){
            var self = this;
            mfs.moveFile({ from: from, to: to }, function(toPath){
                self.success(toPath);
            }); 
        },
        data: { file: to }
    });
}
util.inherits(MoveJob, Job);

function encodeCommand(inputFile, outputFile, handbrakeOptions, embedSrt, verbose){
    var self = this; // jshint ignore:line

    /*
    embed subtitles
    */
    var srtPath = inputFile.replace(/\.\w+$/, "." + "srt");
    if (embedSrt && fs.existsSync(srtPath)){
        handbrakeOptions["srt-file"] = srtPath;
        this.inform("embedding external subs: " + srtPath); // jshint ignore:line
    }

    handbrakeOptions.i = inputFile;
    handbrakeOptions.o = outputFile;
    
    // handbrake-job adapter
    handbrake.spawn(handbrakeOptions)
        .on("progress", function(progress){ self.setProgress(progress); })
        .on("terminated", function(){ self.terminate(); })
        .on("complete", function(){ self.success(); })
        .on("output", function(data){ if (verbose) self.inform(data); })
        .on("error", function(err){ 
            self.error(err); 
        });
}

