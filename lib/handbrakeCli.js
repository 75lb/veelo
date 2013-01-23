/**
a wrapper on HandbrakeCLI
@class handbrakeCLI
@static
*/

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

// emits
var e = {
    success: "success",
    fail: "fail", 
    term: "terminated",
    hbOp: "handbrake-output"
};

function Handbrake(){}
Handbrake.prototype = new EventEmitter();

/**
Runs Handbrake with the supplied `args`.
@method run
@param {Object} args Args to pass to Handbrake
@param {Function} onComplete If passed, will be called with `stdout` and `stderr` on completion. 
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
    handbrakeCLI.run({ preset-list: true }, function(output){
        console.log(output);
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
            handle = cp.spawn(_HandbrakeCLIPath, args);

        handle.stdout.setEncoding("utf-8");
        handle.stdout.on("data", function(data){
            output += data;
            handbrake.emit(e.hbOp, data);
        });

        handle.stderr.setEncoding("utf-8");
        handle.stderr.on("data", function(data){
            output += data;
            handbrake.emit(e.hbOp, data);
        });

        handle.on("exit", function(code, signal){
        
            // Handbrake was killed
            if (signal == "SIGTERM"){
                handbrake.emit(e.term);

            // Handbrake failed
            } else if (code && code != 0){
                handbrake.emit(e.fail, {
                    msg: "there was an issue, HandbrakeCLI exit code: " + code,
                    inputPath: settings.handbrakeArgs.i,
                    output: output
                });

            // Handbrake finished but failed to find video content
            } else if (code == 0 && /No title found\./.test(output)){
                handbrake.emit(e.fail, {
                    msg: "encode failed, not a video file",
                    inputPath: settings.handbrakeArgs.i
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
