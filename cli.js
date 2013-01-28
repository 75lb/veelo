#!/usr/bin/env node

// module dependencies
var util = require("util"),
    colours = require("colors"),
    _ = require("underscore"),
    veelo = require("./lib/veelo"),
    cursor = require("ansi")(process.stdout);

// colours setup
colours.setTheme({
    fileName: "bold",
    hbOutput: "grey",
    em: "italic",
    error: "red",
    strong: "bold",
    warning: "red"
});

var bar,
    previousPercentComplete = 0;

// standard console writing method
function log(){
    var args = Array.prototype.slice.call(arguments)
        addDate = args.shift();
    if (addDate){
        args[0] = util.format("[%s] %s", new Date().toLocaleTimeString(), args[0]);
    } 
    console.log.apply(this, args);
}

function stdoutWrite(data){
    process.stdout.write(data.hbOutput);
}

veelo.config.parseFromCli({
    onInvalidArgs: function(invalid){
        log("Invalid options: " + invalid.join(", "));
    },
    onDone: function(args){
        veelo.add(args.files);
    }
});

// attach listeners
veelo.on("progress", function(progress){
    cursor.horizontalAbsolute(0);
    cursor.eraseLine();
    cursor.write(progress.percentComplete);
});

veelo.on("error", function(err){
    log(true, err);
    process.exit(1);    
});

veelo.on("message", function(msg){
    log(false, msg);
});

veelo.on("warning", function(msg){
    log(true, msg.warning);
});

veelo.on("report", function(report){
    log(false, report);
});

veelo.on("message", function(msg){
    // if(!config.options.veelo["dry-run"]) log(true, msg);
    log(true, msg);
});

veelo.on("output", function(msg){
    // stdoutWrite(msg);
});

veelo.on("begin", function(){
    log(true, "queue length: %d", this.stats.valid);
    log(true, "file types: %s", _.map(this.stats.ext, function(value, key){
        return util.format("%s(%d)", key, value);
    }).join(" "));
});

veelo.on("complete", function(){
    cursor.reset();
    log(false);
    var stats = this.stats;

    log(true, "%d jobs processed in %s (%d successful, %d failed).", stats.valid, stats.elapsed, stats.successful, stats.failed);
    if (this.jobs.failed.length > 0){
        log(true, "the following files failed to encode: ");
        this.jobs.failed.forEach(function(job){
            log(false, job.inputPath.fileName);
        });
    }
});

veelo.on("processing", function(file){
    log(true, "processing: %s", file.fileName);
});

veelo.on("error", function(err){
    log(true, "Error: ".error + err);
    log(false, "Please check your regular expression syntax and try again.".strong);
    process.exit(0);
});

veelo.on("job-fail", function(data){
   log(true, "%s [%s]", data.msg, data.inputPath.fileName);
   if (data.output) log(false, data.output);
});


// start work
veelo.start();


veelo.execute(command, args);

