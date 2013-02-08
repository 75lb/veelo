#!/usr/bin/env node

// module dependencies
var util = require("util"),
    _ = require("underscore"),
    veelo = require("./lib/veelo"),
    cli = require("./lib/cli"),
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

var files = [
    "test/fixture/clip1.mov",
    "test/fixture/music.m4v",
    "test/fixture/medium.m4v",
];

veelo.encode(files, {}, { preset: "iPod" })
    .on("info", function(msg){
        log(true, "Info");
        log(true, "info: %s", msg);
    })
    .on("warning", function(msg){
        log(true, "Warning");
        log(true, "warning: %s", msg);
    })
    .on("error", function(error){
        log(true, "Error");
        log(error);
    })
    .on("starting", function(timer){
        log(true, "Queue starting");
        console.log(timer);
    })
    .on("complete", function(timer){
        log(true, "Queue complete");
        console.log(timer);
    })
    .on("job-starting", function(name, timer){
        log(true, "Job starting: %s", name);
        console.log(timer);
    })
    .on("job-progress", function(name, progress){
        log(true, "Job Progress: %s", name);
        console.log(progress.percentComplete);
    })
    .on("job-complete", function(name, timer){
        log(true, "Job Complete: %s", name);
        console.log(timer);
    });
    