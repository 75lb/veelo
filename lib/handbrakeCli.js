// module dependencies
var path = require("path"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    cp = require("child_process"),
    _ = require("underscore");

// API
module.exports = HandbrakeCLI;

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

// main class definition
function HandbrakeCLI(){}
    
HandbrakeCLI.prototype = new EventEmitter();

HandbrakeCLI.prototype.spawn = function(settings) {
    settings = _.defaults(settings || {}, { 
        emitOutput: false,
        handbrakeArgs: {}
    });
    
    if (Object.keys(settings.handbrakeArgs).length < 2){
        throw new Error("you must pass at least 2 args: -i and -o");
    }
    // console.log(util.inspect(cp, true, null, true));
    var output = "",
        self = this,
        args = flattenArgsHash(settings.handbrakeArgs),
        handle = cp.spawn(_HandbrakeCLIPath, args);

    handle.stdout.setEncoding("utf-8");
    handle.stdout.on("data", function(data){
        output += data;
        self.emit(e.hbOp, data);
    });

    handle.stderr.setEncoding("utf-8");
    handle.stderr.on("data", function(data){
        output += data;
        if (settings.emitOutput) self.emit(e.hbOp, data);
    });

    handle.on("exit", function(code, signal){
        
        // Handbrake was killed
        if (signal == "SIGTERM"){
            self.emit(e.term);

        // Handbrake failed
        } else if (code && code != 0){
            self.emit(e.fail, {
                msg: "there was an issue, HandbrakeCLI exit code: " + code,
                inputPath: settings.handbrakeArgs.i,
                output: output
            });

        // Handbrake finished but failed to find video content
        } else if (code == 0 && /No title found\./.test(output)){
            self.emit(e.fail, {
                msg: "encode failed, not a video file",
                inputPath: settings.handbrakeArgs.i
            });

        // Handbrake finished
        } else {
            self.emit(e.success);
        }
    });
        
    // propogate CTRL+C to Handbrake process
    process.on("SIGINT", function(){
        handle.kill();
    });
};

HandbrakeCLI.prototype.exec = function(settings, done){
    var cmd = util.format('"%s" %s', _HandbrakeCLIPath, flattenArgsHash(settings.handbrakeArgs).join(" "));
    cp.exec(cmd, function(err, stdout, stderr){
        if (err) throw err;
        done(stdout, stderr);
    });
};

HandbrakeCLI.prototype._inject = function(dependencies){
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