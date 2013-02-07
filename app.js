#!/usr/bin/env node

// module dependencies
var util = require("util"),
    _ = require("underscore"),
    veelo = require("./lib/veelo"),
    cli = require("./lib/cli"),
    cursor = require("ansi")(process.stdout);

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
    process.stdout.write(data);
}

// veelo.config.parseFromCli({
//     onInvalidArgs: function(invalid){
//         log("Invalid options: " + invalid.join(", "));
//     },
//     onDone: function(args){
//         veelo.add(args.files);
//     }
// });
// 
// // attach listeners
// veelo.on("progress", function(progress){
//     cursor.horizontalAbsolute(0);
//     cursor.eraseLine();
//     cursor.write(progress.percentComplete);
// });
// 
// veelo.on("error", function(err){
//     log(true, err);
//     process.exit(1);    
// });
// 
// veelo.on("message", function(msg){
//     log(false, msg);
// });
// 
// veelo.on("warning", function(msg){
//     log(true, msg.warning);
// });
// 
// veelo.on("report", function(report){
//     log(false, report);
// });
// 
// veelo.on("message", function(msg){
//     // if(!config.options.veelo["dry-run"]) log(true, msg);
//     log(true, msg);
// });
// 
// veelo.on("output", function(msg){
//     // stdoutWrite(msg);
// });
// 
// veelo.on("begin", function(){
//     log(true, "queue length: %d", this.stats.valid);
//     log(true, "file types: %s", _.map(this.stats.ext, function(value, key){
//         return util.format("%s(%d)", key, value);
//     }).join(" "));
// });
// 
// veelo.on("complete", function(){
//     cursor.reset();
//     log(false);
//     var stats = this.stats;
// 
//     log(true, "%d jobs processed in %s (%d successful, %d failed).", stats.valid, stats.elapsed, stats.successful, stats.failed);
//     if (this.jobs.failed.length > 0){
//         log(true, "the following files failed to encode: ");
//         this.jobs.failed.forEach(function(job){
//             log(false, job.inputPath.fileName);
//         });
//     }
// });
// 
// veelo.on("processing", function(file){
//     log(true, "processing: %s", file.fileName);
// });
// 
// veelo.on("error", function(err){
//     log(true, "Error: ".error + err);
//     log(false, "Please check your regular expression syntax and try again.".strong);
//     process.exit(0);
// });
// 
// veelo.on("job-fail", function(data){
//    log(true, "%s [%s]", data.msg, data.inputPath.fileName);
//    if (data.output) log(false, data.output);
// });
// 
// // start work
// veelo.start();

// make cli.parse understand Config instances, setting values in found on CLI.. passed populated 
// Config instances back to veelo. 

// try{
//     var cliInput = cli.parse(veelo.cliCommands);
// } catch(e) {
//     log(true, "%s: %s", e.name, e.message);
//     process.exit(1);
// }
// 
// switch(cliInput.command){
//     case "encode":
//         log(true, "encoding");
//         veelo.encode(cliInput.files, cliInput.options)
//             .on("starting", function(){})
//             .on("progress", function(){})
//             .on("complete", function(){});
//         break;
//     case "info": 
//         log(true, "getting info");
//         var info = veelo.info();
//         break;
// }

veelo.encode("test/fixture/clip1.mov", {}, { preset: "iPod" })
    .on("info", function(msg){
        log(true, "info: %s", msg);
    })
    .on("warning", function(msg){
        log(true, "warning: %s", msg);
    })
    .on("error", function(error){
        log(true, "error");
        log(error);
    })
    .on("starting", function(timer){
        console.log(timer);
    })
    .on("progress", function(progress){
        console.log(progress);
    })
    .on("complete", function(timer){
        console.log(timer);
    });