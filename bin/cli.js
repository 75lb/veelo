#!/usr/bin/env node
"use strict";

var veelo = require("../lib/veelo"),
    path = require("path"),
    cliArgs = require("command-line-args"),
    hbjs = require("handbrake-js"),
    dope = require("console-dope"),
    handbrakeOptions = hbjs.cliOptions,
    mfs = require("more-fs"),
    FileSet = require("file-set");

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

var cliOptions = handbrakeOptions.concat({
    groups: "veelo",
    options: [
        { name: "files", type: Array, defaultOption: true, required: true },
        { name: "dest", type: String, value: "veelo" },
        { name: "ext", type: String, value: "m4v" }
    ]
});

var argv = cliArgs(cliOptions).parse();

if (!argv.veelo.files) {
    dope.log(usage);
    process.exit(1);
}

var fileSet = new FileSet(argv.veelo.files);
argv.veelo.files = fileSet.files;

mfs.mkdir(argv.veelo.dest);

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

var commands = veelo.buildCommands(argv);
if (commands.length) spawnCommand(commands.shift());
