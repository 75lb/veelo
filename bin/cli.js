#!/usr/bin/env node
"use strict";

var veelo = require("../lib/veelo"),
    Model = require("nature").Model,
    hbjs = require("handbrake-js"),
    dope = require("console-dope"),
    HandbrakeOptions = hbjs.HandbrakeOptions,
    mfs = require("more-fs");

var argv = new Model().define("veelo", [
    { name: "files", type: Array, defaultOption: true },
    { name: "dest", type: "string", groups: "veelo" },
    { name: "ext", type: "string", groups: "veelo" }
]);
argv.mixIn(new HandbrakeOptions(), "handbrake");
argv.set(process.argv);

var commands = veelo.buildCommands(argv);

function spawnCommand(command){
    hbjs.spawn(command)
        .on("error", function(err){
            dope.red.error(err);
        })
        .on("start", function(){
            dope.orange.log("let's go");
        })
        .on("progress", function(progress){
            dope.log("%s % complete", progress.percentComplete);
        })
        .on("complete", function(){
            dope.green.log("yeah, ho");
            spawnCommand(commands.shift());
        });
}
if (commands.length) spawnCommand(commands.shift());
