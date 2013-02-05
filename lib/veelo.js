/**
 The Video Library Optimisation (V-LO) tool.
 @module veelo 
*/

// module dependencies 
var EventEmitter = require("events").EventEmitter,
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    _ = require("underscore"),
    handbrakeCLI = require("./handbrake"),
    Config = require("./config"),
    shared = require("../test/shared"),
    EncodeQueue = require("./encode-queue");

/**
Synopsis:

    var veelo = require("veelo");
    
    veelo.encode(["Oh ffs.wmv", "Doc off.avi"], { preset: "Normal" })
         .on("starting", function(stats){
             console.log("%d encodes queued. File types: %s")
         })
         .on("progress", function(progress){
             console.log("%d% complete", progress.percentComplete);
         })
         .on("complete", function(stats){
             console.log("%d encodes complete: %d success, %d fail. ");
         });
    
@class veelo
@static
*/

// veelo.start = function start(){
//     _stats.time.start = Date.now();
//     this.emit(e.starting, _stats.clone());
// 
//     // user asks for help
//     if (config.has(["help", "hbhelp"])) {
//         getUsage(config.get("hbhelp"), function(usage){
//             veelo.emit("message", usage);
//         });
// 
//     // config
//     } else if (config.has("config")){
//         veelo.emit("message", config._getActive().map(function(item){
//             return item.name + ": " + item.value;
//         }));
//     
//     // version number
//     } else if (config.get("version")){
//         var packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8"));
//         if (packageJson.version){
//             veelo.emit("message", packageJson.version);
//         }
//     
//     // user passes options that don't require files
//     } else if (config.has(["preset-list", "update"])) {
//         handbrakeCLI.run(config.group("handbrake").toJSON(), function(stdout, stderr){
//             veelo.emit("message", stdout + stderr);
//         });
// 
//     // user passes files
//     } else if (_stats.jobs.valid > 0){
// 
//         // custom preset
//         if (config.has("preset")){
//             var preset = config.get("preset"),
//                 udp = config.get("user-defined-presets")[preset];
//             
//             if (udp !== undefined){
//                 config.unset("preset");
//                 config.set(udp);
//             }
//         }
// 
//         // certain commands depend on --verbose
//         if (config.has(["title", "scan"])){
//             config.set("verbose", true);
//         }
// 
//         // --dry-run
//         if (config.has("dry-run")){
//             veelo.emit("report", veelo.getReport());
//             veelo.cancel();
//         } else {
            // start queue
//         }
//     
//     // everything else is invalid usage
//     } else {
//         veelo.emit("message", veelo.usage);
//     }
// };
// 
exports._inject = function _inject(MockQueue, MockJob){
    EncodeQueue._inject(MockJob);
}

exports.usage = 
"\nUsage: veelo [options] [HandbrakeCLI options] [files]\n\n" +
"### Veelo Options-------------------------------------------------------\n" + 
"        --ext <string>         Output file extension (implicitly sets container format). Choose 'mp4', 'm4v' or 'mkv'.\n" +
"        --archive              Archive the original file to a specified directory (defaultVal: 'veelo-originals')\n" +
"        --output-dir <string>  Outputs to the specified directory\n" + 
"        --preserve-dates       Preserve input's 'modified' and 'accessed' times on the output file\n" + 
"        --recurse              Traverse into directories\n" + 
"        --include <regex>      Regex include filter, for use with --recurse\n" + 
"        --exclude <regex>      Regex exclude filter, for use with --recurse\n" + 
"        --dry-run              Describe the outcome without performing the actual work\n" + 
"        --embed-srt            If a matching .srt file exists, embed subtitles into the output video\n" +
"    -v, --verbose              Show detailed output\n" +
"        --version              Show version info\n" +
// "        --config               Show current configuration\n" +
"    -h, --help                 Show this help\n" +
"        --hbhelp               Show this help plus all HandbrakeCLI options\n\n";

exports.help = {
    usage: "Usage: veelo <command> [options] [HandbrakeCLI options] [files]",
    commands: [
        // { name: "encode", config: new ConfigFactory("encode") }        
    ]
};

// internal implementation functions
function getUsage(includeHandbrakeOpts, done){
    var output = veelo.usage;
    if (includeHandbrakeOpts){
        handbrakeCLI.run({ h: true }, function(stdout, stderr){
            output += stdout.replace(/^.*$\n\n/m, "");
            done(output);
        });
    } else {
        done(output);
    }
}

// // Define Veelo configuration options
// config
//     .group("veelo")
//         .option("help", { type: "boolean", alias: "h" })
//         .option("hbhelp", { type: "boolean" })
//         .option("verbose", { type: "boolean", alias: "v" })
//         .option("version", { type: "boolean" })
//         .option("config", { type: "boolean" })
//         .option("recurse", { type: "boolean" })
//         .option("dry-run", { type: "boolean" })
//         .option("output-dir", { type: "string" })
//         .option("ignoreList", { type: "array", defaultVal: [] })
//         .option("user-defined-presets", { type: "object" })
//     .parseConfigFile({
//         onInvalidJSON: function(err, configPath){
//             veelo.emit(
//                 "warning", 
//                 "Fatal error parsing config: " + err + 
//                 "\nPlease ensure this config file is valid JSON: " + configPath
//             );
//         }
//     });
// 
// 

/**
Command-based interface
@method execute
@param {String} command The command name to execute, e.g. "encode"
@param args {any} The args to pass to the command
@example
    var queue = veelo.execute("encode", ["Tons of wood.mov", "Tons of stone.mov"], { preset: "Normal" });
*/
exports.execute = function(command){
    command.execute();
};

/**
Encode a file or files
@method encode
@param {Array} files The files to encode
@param {Config} [options]
@return {EncodeQueue}
@example
    var queue = veelo.encode(["Rawhide 1.wmv", "Rawhide 2.wmv"], { preset: "Normal" });
    queue.on("progress", function(progress){
        console.log(progress.percentComplete);
    });
*/
exports.encode = function(files, options){
    var config = exports.encode.config(options),
        queue = new EncodeQueue(files, options);
    
    return queue;
};

exports.encode.config = function(values){
    return new Config()
        .option("recurse", { type: "boolean" })
        .option("dry-run", { type: "boolean" })
        .option("include", { type: "regex" })
        .option("exclude", { type: "regex" })
        .option("user-defined-presets", { type: "object" })
        .set(values);
}

/**
@method info
@param {String|Array} files A single, or Array of filenames.
@param {Object} options A hash containing one or more of the following options: 

* html {Boolean}: returns HTML format if true

@return {Array} An array of {{#crossLink "VideoInfo"}}{{/crossLink}} objects
@example 
Return info on all files beneath the "Music" directory:

    var info = veelo.info(["Music"], { recurse: true });
@example
Returns info formatted as HTML strings:

    var info = veelo.info(["Tales of the Unexpected.avi"], { html: true });
@example
Print the config definition for this method: 

    console.log(veelo.info.config.toJSON());

*/
exports.info = function(files, options){};
exports.info.config = function(values){
    return new Config();
};

/**
@method help
@return {String}
@example
    console.log(veelo.help("Picture"));
*/
exports.help = function(topic){};

/**
Manage user defaults (stored in `~/.veelo.json`)
@method defaults
@chainable
@example
    veelo.config.add("srt-lang", "English")
                .remove("preset", "Android")
                .list();
*/
exports.defaults = function(){};

/**
Preset Management
@method preset
@chainable
@example
    veelo.preset.set("my phone", { rotate: 3, quality: 25 });
    veelo.preset.remove("preset");
    veelo.preset.list();
*/
exports.preset = function(){};

/**

@method split
@return {Queue}
@example
    var queue = veelo.split("Goodbye Uncle Tom.avi", 900, { preset: "Normal" });
*/
exports.split = function(){};

/**
@method collage
@return {Queue}
@example
    var queue = veelo.collage("Films", 2, { recurse: true });
*/
exports.collage = function(){};

// exports.cliCommands = [
//     { command: "encode", config: exports.encode.config() },
//     { command: "help" },
//     { command: "info", config: veelo.info.config() }
// ];