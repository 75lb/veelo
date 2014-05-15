"use strict";

exports.buildCommands = buildCommands;

function buildCommands(argv){
    return [{ input: "test/assets/music.m4v", output: "tmp/assets/music.m4v" }]
}