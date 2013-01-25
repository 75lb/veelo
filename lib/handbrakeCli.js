// module dependencies
var path = require("path"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    cp = require("child_process"),
    _ = require("underscore");

// privates 
var _HandbrakeCLIPath = 
    process.platform == "darwin"
        ? path.join(__dirname, "../bin/HandbrakeCLI")
        : process.platform == "win32"
            ? process.arch == "x64"
                ? path.join(__dirname, "../bin/HandbrakeCLIx64.exe")
                : path.join(__dirname, "..", "bin", "HandbrakeCLIx32.exe")
            : "HandBrakeCLI";

/**
A handle on the Handbrake process, returned by handbrakeCLI.run()
@private
@class Handbrake
@constructor
*/
function Handbrake(){}
Handbrake.prototype = new EventEmitter();

// Handbrake Events
var e = {
    /**
    @event success
    */
    success: "success",
    /**
    @event error
    @param {String} msg
    @param {Object} args
    @param {String} output
    */
    error: "error",
    /**
    @event terminated
    */
    terminated: "terminated",
    /**
    @event output
    @param {String} output
    */
    output: "output",
    /**
    @event progress
    @param {Object} progress Returns an object, like
    percentComplete {Number}
    fps {Number}
    avgFps {Number}
    eta {String}
    */
    progress: "progress"
};

/**
a wrapper on HandbrakeCLI
@class handbrakeCLI
@static
*/

/**
Runs Handbrake with the supplied `args`.
@method run
@param {Object} args Args to pass to Handbrake
@param {Function} [onComplete] If passed, will be called with `stdout` and `stderr` on completion. 
@return {Handbrake} Returns a handle on the Handbrake process.

@example
    var handle = handbrakeCLI.run({
        input: "Eight Miles High.mov",
        output: "Eight Miles High.m4v",
        preset: "Normal"
    });
    handle.on("output", function(output){
        console.log(output);
    });
    handle.on("progress", function(progress){
        console.log(progress.percentComplete);
    });

@example
    handbrakeCLI.run({ preset-list: true }, function(stdout, stderr){
        console.log(stdout);
    });
    
*/
exports.run = function(args, onComplete){

    if (onComplete){
        var cmd = util.format('"%s" %s', _HandbrakeCLIPath, flattenArgsHash(args).join(" "));
        cp.exec(cmd, function(err, stdout, stderr){
            if (err) throw err;
            onComplete(stdout, stderr);
        });
    } else {
        var output = "",
            handbrake = new Handbrake(),
            handle = cp.spawn(_HandbrakeCLIPath, flattenArgsHash(args));

        handbrake.args = args;
        handle.stdout.setEncoding("utf-8");
        handle.stderr.setEncoding("utf-8");

        handle.stdout.on("data", function(data){
            output += data;
            if (/Encoding:/.test(data)){
                var match = data.match(/task 1 of 1, (.*) %( \((.*?) fps, avg (.*?) fps, ETA (.*?)\))?/);
                handbrake.emit(e.progress, {
                    percentComplete: match[1],
                    fps: +match[3],
                    avgFps: +match[4],
                    eta: match[5]
                });
            } else {
                handbrake.emit(e.output, data);
            }
        });
        
        handle.stderr.on("data", function(data){
            output += data;
            handbrake.emit(e.output, data);
        });

        handle.on("exit", function(code, signal){
        
            // Handbrake was killed
            if (signal == "SIGTERM"){
                handbrake.emit(e.terminated);

            // Handbrake failed
            } else if (code && code != 0){
                handbrake.emit(e.error, {
                    msg: "there was an issue, HandbrakeCLI exit code: " + code,
                    args: args,
                    output: output
                });

            // Handbrake finished but failed to find video content
            } else if (code == 0 && /No title found\./.test(output)){
                handbrake.emit(e.error, {
                    msg: "encode failed, not a video file",
                    args: args,
                    output: output
                });

            // Handbrake finished
            } else {
                handbrake.emit(e.success);
            }
        });

        // propogate CTRL+C to Handbrake process
        process.on("SIGINT", function(){
            handle.kill();
        });
        
        return handbrake;
    }
}

exports._inject = function(dependencies){
    cp = dependencies.cp || cp;   
};

function flattenArgsHash(argsHash){
    var output;
    output = _.pairs(argsHash);
    output.forEach(function(pair){
        if (pair[0].length == 1){
            pair[0] = "-" + pair[0];
        } else {
            pair[0] = "--" + pair[0];
        }
    });
    output = _.flatten(output);
    return output;
}
