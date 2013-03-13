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
            .on("queue-info", function(queue, msg){ log(msg); })
            // .on("job-starting", function(job){ log(job.name, "starting"); })
            .on("job-progress", function(job, encode){ 
                var full = "%s: %d\% complete [%d fps, %d average fps, eta: %s]\n",
                    short = "%s: %d\% complete\n";
                if(encode.fps){
                    var line = util.format(full, job.data.file, encode.percentComplete, encode.fps, encode.avgFps, encode.eta);
                    cursor.eraseLine(2);
                    cursor.write(line);
                    cursor.previousLine();
                } else {
                    var line = util.format(short, job.data.file, encode.percentComplete);
                    cursor.eraseLine(2);
                    cursor.write(line);
                    cursor.previousLine();
                }
            })
            // .on("job-complete", function(job){ log("Job complete: " + job.name); })
            .on("job-success", function(job){ 
                log(job.name, "success", job.data.file);
            })
            .on("job-fail", function(job){ 
                log(job.name, "fail", job.data.file); 
            })
            .on("job-info", function(job, msg){ log(msg); })
            .on("job-warning", function(job, msg){ log(msg); })
            .on("job-error", function(job, err){ 
                log(err.message, "error");
            })
            .on("job-terminated", function(job){ log("job-terminated: " + job.name); })
            .on("error", function(err){ 
                console.log(err); 
                veelo.help(process.argv, log);
            });
        break;
    case "info":
        veelo.info(process.argv)
            .on("job-info", function(job, info){
                log(info);
            });
        break;
    case "help":
        veelo.help(process.argv, function(help){
            log(help);
        });
        break;
}
    
function log(msg, type, file){
    cursor
        .horizontalAbsolute(0)
        .eraseLine(2);
    
    switch(type){
        case "starting": 
            cursor.write("□ ");
            break;
        case "success": 
            cursor.fg.green()
                .write("■ ")
                .fg.reset();
            break;
        case "fail": 
            cursor.fg.red()
                .write("■ ")
                .fg.reset();
            break;
        case "error": 
            cursor.fg.red()
                .write("■ ")
                .fg.reset();
            break;
    }
    
    
    if(typeof msg === "string"){
        msg.replace(/\n$/, "");
        cursor.write(file ? msg : msg + "\n");
    } else {
        cursor.write(util.inspect(msg) + "\n");
    }
    
    if (file){
        cursor.bold()
            .write(util.format(" [%s]\n", file))
            .reset();
    }
}