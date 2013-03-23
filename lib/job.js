var work = require("work"),
    util = require("util"),
    handbrake = require("handbrake-js"),
    mfs = require("more-fs"),
    Job = work.Job,
    Queue = work.Queue;

exports.EncodeJob = EncodeJob;
exports.DeleteJob = DeleteJob;
exports.MoveJob = MoveJob;

function l(msg){
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(this, args);
}

function EncodeJob(config, path){
    Job.call(this, {
        name: "Encode",
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
        async: true, 
        command: function(){ 
            var self = this;
            mfs.moveFile({ from: from, to: to }, function(toPath){
                l("moveFile complete. safe: %s, from: %s, to: %s, toPath: %s", from, to, toPath);
                self.emitSuccess(toPath);
            }); 
        },
        data: { file: to }
    });
    
}
util.inherits(MoveJob, Job);
