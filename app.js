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
            .on("starting", function(job){
                if (job.distinctExts){
                    log("File types: " + _.map(job.distinctExts(), function(value, key){
                		return util.format("%s(%d)", key, value);
                	}).join(" "));
                }
            })
            .on("monitor", function(job){
                cursor.eraseData(2);
                cursor.goto(1, 1);
                this.print();
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