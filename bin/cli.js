#!/usr/bin/env node
"use strict";
var veelo = require("../lib/veelo");
var path = require("path");
var cliArgs = require("command-line-args");
var hbjs = require("handbrake-js");
var dope = require("console-dope");
var mfs = require("more-fs");
var FileSet = require("file-set");

var handbrakeOptions = hbjs.cliOptions.map(function(def){
    def.group = [ def.group, "handbrake" ];
    return def;
});

var usage =
"usage: veelo [options] [HandbrakeCLI options] files\n\n\
### Veelo Options-------------------------------------------------------\n\
        --ext <string>         Output file extension (implicitly sets container format). Choose 'mp4', 'm4v' or 'mkv'.\n\
        --archive              Archive the original file to a specified directory (default: 'veelo-originals')\n\
        --dest <string>        Outputs to the specified directory\n\
        --preserve-dates       Preserve input's 'modified' and 'accessed' times on the output file\n\
        --dry-run              Describe the outcome without performing the actual work\n\
        --embed-srt            If a matching .srt file exists, embed subtitles into the output video\n\
    -v, --verbose              Show detailed output\n";

var cliOptions = handbrakeOptions.concat([
    { name: "files", type: String, multiple: true, defaultOption: true, group: "veelo" },
    { name: "dest", type: String, defaultValue: "veelo", group: "veelo" },
    { name: "ext", type: String, defaultValue: "m4v", group: "veelo" }
]);

var options = cliArgs(cliOptions).parse();

if (!(options.veelo && options.veelo.files)) {
    dope.log(usage);
    process.exit(1);
}
var fileSet = new FileSet(options.veelo.files);
options.veelo.files = fileSet.files;

mfs.mkdir(options.veelo.dest);

function spawnCommand(command){
    if(!command) return;

    hbjs.spawn(command)
        .on("error", function(err){
            dope.red.error(err);
        })
        .on("begin", function(){
            dope.blue.log("let's go");
        })
        .on("progress", function(progress){
            dope.log("%s: %s %s% complete", this.options.input, progress.task, progress.percentComplete);
        })
        .on("end", function(){
            this.ended = true;
            dope.green.log("finito");
        })
        .on("complete", function(){
            if (!this.ended) dope.red.log("Didn't complete")
            spawnCommand(commands.shift());
        });
}

var commands = veelo.buildCommands(options);
if (commands.length) spawnCommand(commands.shift());
