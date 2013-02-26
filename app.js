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
    : /encode|help|info/.test(process.argv[0])
        ? process.argv.shift()
        : "encode";

switch (command){
    default:
        veelo.encode(process.argv)
            .on("info", function(msg){
                stdoutWrite(msg);
            })
            .on("warning", function(msg){
                log(true, "Warning");
                log(true, "warning: %s", msg);
            })
            .on("error", function(error){
                log(true, error.stack);
            })
            .on("starting", function(timer){
                log(true, "Queue starting");
                log(false, this.jobs);
            })
            .on("complete", function(timer){
                log(true, "Queue complete");
                console.log(timer.duration);
            })
            .on("terminated", function(){
                log(true, "Terminated");
            })
            .on("job-starting", function(name, timer){
                log(true, "Job starting: %s", name);
            })
            .on("job-progress", function(name, encode){
                var full = "encode: %d\% complete [%d fps, %d average fps, eta: %s]",
                    short = "encode: %d\% complete";
                if(encode.fps){
                    log(full, encode.percentComplete, encode.fps, encode.avgFps, encode.eta);
                } else {
                    log(short, encode.percentComplete);
                }
            })
            .on("job-complete", function(name, timer){
                log(true, "Job Complete: %s", name);
                console.log(timer.duration);
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
    