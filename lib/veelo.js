"use strict";
var path = require("path"),
    w = require("wodge");

exports.buildCommands = buildCommands;

function buildCommands(argv){
    return argv.veelo.files.map(function(file){
        var command = w.clone(argv.handbrake);
        command.input = file;
        command.output = path.resolve(
            argv.veelo.dest, 
            path.dirname(file), 
            path.basename(file, path.extname(file)) + "." + argv.veelo.ext
        );
        return command;
    });
}
