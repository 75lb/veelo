#!/usr/bin/env node
"use strict";

// module dependencies
var util = require("util"),
    _ = require("underscore"),
    veelo = require("./lib/veelo"),
    cursor = require("ansi")(process.stdout);

process.argv.splice(0, 2);

function l(){ console.log.apply(this, Array.prototype.slice.call(arguments)); }

var command = process.argv.length === 0
    ? "help"
    : /^(encode|help|info)$/.test(process.argv[0])
        ? process.argv.shift()
        : "encode";

switch (command){
    default:
        veelo.encode(process.argv).monitor();
            // .on("monitor", function(job, event, data){
            //     console.log(job.name, event);
            // });
        break;
    case "info":
        veelo.info(process.argv)
            .on("monitor", function(job, eventName, info){
                if (eventName == "info") l(info);
            });
        break;
    case "help":
        veelo.help(process.argv, function(help){
            l(help);
        });
        break;
}
