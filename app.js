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
                    log("File types: " + _.map(queue.distinctExts(), function(value, key){
                		return util.format("%s(%d)", key, value);
                	}).join(" "));
                }
            })
            .on("queue-complete", function(queue){ 
                if (queue == this){
                    log("Queue complete: " + queue.name); 
                }
            })
            .on("queue-info", function(state, msg){ log(msg); })
            .on("job-starting", function(job){
                log("□ Job starting: " + job.name);
            })
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
            // .on("job-complete", function(state){ log("Job complete: " + state); })
            .on("job-success", function(job){ 
                log("■ Job success: " + job.name); 
            })
            .on("job-fail", function(state){ log("Job fail: " + state); })
            .on("job-info", function(state, msg){ 
                log(msg); 
            })
            .on("job-warning", function(state, msg){ log(msg); })
            .on("job-error", function(state, err){ 
                log("job-error: " + err.msg);
            })
            .on("job-terminated", function(state){ log("job-terminated: " + state); })
            .on("error", function(err){ 
                log(err); 
                veelo.help(process.argv, log);
            });
        break;
    case "info":
        veelo.info(process.argv)
            .on("job-info", function(state, info){
                log(info);
            });
        break;
    case "help":
        veelo.help(process.argv, function(help){
            log(help);
        });
        break;
}
    
function log(msg){
    cursor
        .horizontalAbsolute(0)
        .eraseLine(2)
        .write(typeof msg === "string" 
            ? msg + (/\n$/.test(msg) 
                ? "" 
                : "\n")
            : util.inspect(msg)
        );
}