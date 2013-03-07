#!/usr/bin/env node

// module dependencies
var util = require("util"),
    _ = require("underscore"),
    veelo = require("./lib/veelo"),
    cursor = require("ansi")(process.stdout);

process.argv.splice(0, 2);

var command = process.argv.length == 0
    ? "help"
    : /^(encode|help|info)$/.test(process.argv[0])
        ? process.argv.shift()
        : "encode";

switch (command){
    default:
        veelo.encode(process.argv)
            .on("queue-starting", function(queue){ 
                if (queue.distinctExts){
                    console.log("File types: " + _.map(queue.distinctExts(), function(value, key){
                		return util.format("%s(%d)", key, value);
                	}).join(" "));
                }
            })
            .on("queue-complete", function(queue){ 
                if (queue == this){
                    console.log("Queue complete: " + queue.name); 
                }
            })
            .on("queue-info", function(state, msg){ console.log(msg); })
            .on("job-starting", function(job){ console.log("Job starting: " + job.name); })
            .on("job-progress", function(state, encode){ 
                var full = "encode: %d\% complete [%d fps, %d average fps, eta: %s]\n",
                    short = "encode: %d\% complete\n";
                // var full = "encode: %d\% complete [%d fps, %d average fps, eta: %s]",
                //     short = "encode: %d\% complete";
                if(encode.fps){
                    var line = util.format(full, encode.percentComplete, encode.fps, encode.avgFps, encode.eta);
                    cursor.eraseLine(2);
                    cursor.write(line);
                    cursor.previousLine();
                } else {
                    var line = util.format(short, encode.percentComplete);
                    cursor.eraseLine(2);
                    cursor.write(line);
                    cursor.previousLine();
                }
            })
            // .on("job-complete", function(state){ console.log("Job complete: " + state); })
            // .on("job-success", function(state){ console.log("Job success: " + state); })
            .on("job-fail", function(state){ console.log("Job fail: " + state); })
            .on("job-info", function(state, msg){ 
                if(/\n$/.test(msg)){
                    cursor.write(msg);
                } else {
                    console.log(msg); 
                }
            })
            .on("job-warning", function(state, msg){ console.log(msg); })
            .on("job-error", function(state, err){ 
                console.log("job-error: " + state); 
                console.log(err);
            })
            .on("job-terminated", function(state){ console.log("job-terminated: " + state); })
            .on("error", function(err){ 
                console.log(err); 
                veelo.help(process.argv, console.log);
            });
        break;
    case "info":
        veelo.info(process.argv)
            .on("info", function(msg){
                console.log(help);
            });
        break;
    case "help":
        veelo.help(process.argv, function(help){
            console.log(help);
        });
        break;
}
    