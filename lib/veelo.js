"use strict";
var path = require("path");

exports.buildCommands = buildCommands;

function buildCommands(argv){
    return argv.files.map(function(file){
        var command = argv.where({ group: "handbrake" }).toJSON();
        command.input = file;
        command.output = path.resolve(argv.dest, file);
        return command;
    });
}
