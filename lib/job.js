"use strict";
var work = require("../../work"),
    fs = require("fs"),
    util = require("util"),
    handbrake = require("handbrake-js"),
    mfs = require("more-fs"),
    Job = work.Job;

exports.EncodeJob = EncodeJob;
exports.DeleteJob = DeleteJob;
exports.MoveJob = MoveJob;

var l = console.log;

function EncodeJob(config, path){
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

function encodeCommand(inputFile, outputFile, handbrakeOptions, embedSrt, verbose){
    var self = this;
    // embed subtitles
    var srtPath = inputFile.replace(/\.\w+$/, "." + "srt");
    if (embedSrt && fs.existsSync(srtPath)){
        handbrakeOptions["srt-file"] = srtPath;
        job.inform("embedding external subs: " + srtPath);
    }

    handbrakeOptions.i = inputFile;
    handbrakeOptions.o = outputFile;
    
    // handbrake-job adapter
    handbrake.spawn(handbrakeOptions)
        .on("progress", function(progress){ self.setProgress(progress); })
        .on("terminated", function(){ self.terminate(); })
        .on("complete", function(){ self.success(); })
        .on("output", function(data){ verbose && self.inform(data); })
        .on("error", function(err){ 
            self.error(err); 
        });
}

function DeleteJob(name, file){
    Job.call(this, {
        name: name,
        commandSync: mfs.deleteFile,
        args: file,
        data: { file: file }
    });
}
util.inherits(DeleteJob, Job);

function MoveJob(name, from, to){
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
