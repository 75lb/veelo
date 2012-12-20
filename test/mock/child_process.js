var EventEmitter = require("events").EventEmitter,
    Stream = require("stream");

exports.handle = new ChildProcess();
exports.spawn = function(command, args, options){
    return exports.handle;
};

function ChildProcess(){
    this.stdin = new ReadableStream();
    this.stdout = new ReadableStream();
    this.stderr = new ReadableStream();  
}
ChildProcess.prototype = new EventEmitter();

function ReadableStream(){
    this.setEncoding = function(){};
}
ReadableStream.prototype = new Stream();