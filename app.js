#!/usr/bin/env node
"use strict";

// module dependencies
var util = require("util"),
    _ = require("underscore"),
    encode = require("./lib/encode"),
    info = require("./lib/info"),
    help = require("./lib/help"),
    cursor = require("ansi")(process.stdout),
    l = console.log;

process.argv.splice(0, 2);

var command = process.argv.length === 0
    ? "help"
    : /^(encode|help|info)$/.test(process.argv[0])
        ? process.argv.shift()
        : "encode";

switch (command){
    default:
        encode(process.argv).monitor();
            // .on("monitor", function(job, event, data){
            //     console.log(job.name, event);
            // });
        break;
    case "info":
        info(process.argv)
            .on("monitor", function(job, eventName, info){
                if (eventName == "info") l(info);
            });
        break;
    case "help":
        help(process.argv, function(help){
            l(help);
        });
        break;
}
