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
                print(this);
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

function print(job, indent){
    indent = indent || 0;
    var padding = "";
    for(var i=0; i<indent; i++){
        padding += " ";
    }
    cursor.write(padding)
        .bold().write(job.name).reset();
    
    if (job.runOn) cursor.write(" on-" + job.runOn);
    if (job.progress) cursor.write(" " + job.progress.percentComplete + "%");
    if (job.running) cursor.fg.green(); else cursor.fg.red();
    cursor.write(" running").fg.reset()
    if (job.successful) cursor.fg.green(); else cursor.fg.red();
    cursor.write(" successful").fg.reset()
    if (job.complete) cursor.fg.green(); else cursor.fg.red();
    cursor.write(" complete").fg.reset()
    if (job.terminated) cursor.fg.green(); else cursor.fg.red();
    cursor.write(" terminated").fg.reset()
    if (job.ignored) cursor.fg.green(); else cursor.fg.red();
    cursor.write(" ignored").fg.reset()
    cursor.write(" " + job.errors)
    cursor.write("\n");
        
    // l("%s%s [rO: %s, p: %s, r: %s, s: %s, c: %s, e: %s, t: %s, i: %s]", padding, this.name, this.runOn || "", this.progress ? this.progress.percentComplete : "", this.running, this.successful, this.complete, this.errors, this.terminated, this.ignored);
    job.children.forEach(function(child){
        print(child, indent + 2);
    });
}