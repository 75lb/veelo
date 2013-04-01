#!/usr/bin/env node

// module dependencies
var util = require("util"),
    _ = require("underscore"),
    veelo = require("./lib/veelo"),
    cursor = require("ansi")(process.stdout);

process.argv.splice(0, 2);

function l(msg){
    console.log.apply(this, Array.prototype.slice.call(arguments));
}

var command = process.argv.length == 0
    ? "help"
    : /^(encode|help|info)$/.test(process.argv[0])
        ? process.argv.shift()
        : "encode";

switch (command){
    default:
        veelo.encode(process.argv)
            .monitor(process.stdout)
            // .on("monitor", function(job, eventName){
            //     switch(eventName){
            //         case "info":
            //             l(job.info[job.info.length-1]);
            //             break;
            //     }
            // })
            .on("starting", function(job){
                if (job.distinctExts){
                    l("File types: " + _.map(job.distinctExts(), function(value, key){
                		return util.format("%s(%d)", key, value);
                	}).join(" "));
                }
            });
        break;
    case "info":
        veelo.info(process.argv)
            .on("job-info", function(job, info){
                l(info);
            });
        break;
    case "help":
        veelo.help(process.argv, function(help){
            l(help);
        });
        break;
}
