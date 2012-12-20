var EventEmitter = require("events").EventEmitter;

module.exports.spawn = function(command, args, options){
    return new ChildProcess();
}

function ChildProcess(){
    this.stdin = new ReadableStream();
    this.stdout = new ReadableStream();
    this.stderr = new ReadableStream();  
}

function ReadableStream(){
    this.setEncoding = function(){};
}