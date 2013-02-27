#!/usr/bin/env node

// module dependencies
var util = require("util"),
    _ = require("underscore"),
    veelo = require("./lib/veelo"),
    cursor = require("ansi")(process.stdout);

// standard console writing method
function log(){
    var args = Array.prototype.slice.call(arguments)
        addDate = args.shift();
    if (addDate){
        args[0] = util.format("[%s] %s", new Date().toLocaleTimeString(), args[0]);
    } 
    console.log.apply(this, args);
}

function stdoutWrite(data){
    process.stdout.write(data);
}

process.argv.splice(0, 2);

var command = process.argv.length == 0
    ? "help"
    : /^(encode|help|info)$/.test(process.argv[0])
        ? process.argv.shift()
        : "encode";

switch (command){
    default:
        veelo.encode(process.argv)
            .on("queue-starting", function(state){ console.log("Queue starting: " + state); })
            .on("queue-complete", function(state){ console.log("Queue complete: " + state); })
            .on("job-starting", function(state){ console.log("Job starting: " + state); })
            .on("job-progress", function(state, progress){ 
                console.log("Job progress: " + state + progress.percentComplete); 
                //     var full = "encode: %d\% complete [%d fps, %d average fps, eta: %s]",
                //         short = "encode: %d\% complete";
                //     if(encode.fps){
                //         log(full, encode.percentComplete, encode.fps, encode.avgFps, encode.eta);
                //     } else {
                //         log(short, encode.percentComplete);
                //     }
            })
            .on("job-complete", function(state){ console.log("Job complete: " + state); })
            .on("job-success", function(state){ console.log("Job success: " + state); })
            .on("job-fail", function(state){ console.log("Job fail: " + state); })
            .on("job-info", function(state, msg){ console.log("Job info: " + msg + state); })
            .on("job-warning", function(state, msg){ console.log("job-warning: " + msg + state); })
            .on("job-error", function(state, err){ console.log("job-error: " + state + err); })
            .on("job-terminated", function(state){ console.log("job-terminated: " + state); })
            .on("error", function(err){ 
                console.log(err); 
                veelo.help(process.argv, console.log);
            });
        break;
    case "info":
        veelo.info(process.argv)
            .on("info", function(msg){
                stdoutWrite(msg);
            });
        break;
    case "help":
        veelo.help(process.argv, function(help){
            log(false, help);
        });
        break;
}
    