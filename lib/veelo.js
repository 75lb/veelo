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
    ConfigMaster = require("./config-master"),
    Config = require("./config"),
    Job = require("./job"),
    handbrake = require("./handbrake"),
    general = require("./general"),
    Queue = require("./queue");

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

var configMaster = new ConfigMaster();

// define config
configMaster.add(
    "files",
    new Config()
        .option("files", { 
            type: "array",
            required: true,
            defaultOption: true,
            valid: { pathExists: true }
        })
        .option("recurse", { type: "boolean" })
        .option("include", { type: "regex" })
        .option("exclude", { type: "regex" })
        .option("ignoreList", { type: "array", default: [] })    
);
configMaster.add(
    "encode-job",
    new Config()
        .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", default: "m4v" })
        .option("archive", { type: "boolean" })
        .option("archiveDirectory", { type: "string", default: "veelo-originals" })
        .option("output-dir", { type: "string" })
        .option("embed-srt", { type: "boolean" })
        .option("verbose", { type: "boolean", alias: "v" })
        .option("preserve-dates", { type: "boolean" })
        .option("dry-run", { type: "boolean" })
        .option("user-defined-presets", { type: "object" })
);
configMaster.add("handbrake", handbrake.run.config);
configMaster.add("encode", [ "files", "encode-job", "handbrake" ]);

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

exports.usage2 = {
    usage: "Usage: veelo <command> [options] [HandbrakeCLI options] [files]",
    commands: [
        // { name: "encode", config: new ConfigFactory("encode") }        
    ]
};

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
exports.encode = function(options){
    var config = configMaster.get("encode", options);

    var files = config.get("files");
    var queue = new Queue();
    
    files.forEach(function(file){
        // also check ignore list
        if (fs.existsSync(file) && fs.statSync(file).isFile()){
            var job = new Job("Encode file: " + file),
                newFile = general.replaceFileExtension(file, options.ext),
                workingPath = general.getTempFilePath(newFile);
            
            job.command = encodeCommand(
                file, 
                workingPath, 
                config.group("handbrake").toConfig(),
                config.get("embed-srt"), 
                config.get("verbose")
            );
            job.undo = function(){
                this.emit("warning", "undoing: deleting " + workingPath);
                general.deleteFile(workingPath);
            };
            job.on("terminated", function(){
                job.undo();
            });
            queue.add(job);
        
            if (config.get("archive")){
                var from = file,
                    to = general.getSubDirPath(file, config.get("archiveDirectory")),
                    archiveJob = new Job("archive original video to: " + to);
                
                archiveJob.async = true;
                archiveJob.command = function(){ general.moveFile(from, to); };
                queue.add(archiveJob);
            }
        
            var copyJob = new Job("moving to output location: " + file);
            copyJob.async = true;
            queue.add(copyJob);

            if (options["output-dir"]){
                var outputDir = options["output-dir"].trim(),
                    outputPath = "";

                // specific path specified
                if (/^\.\//.test(outputDir) || /^\//.test(outputDir) || /\.\.\//.test(outputDir)){
                    outputPath = path.join(outputDir, newFile);
                // subdir path relative of input file
                } else {
                    outputPath = general.getSubDirPath(newFile, outputDir);
                }
            
                // TODO: test copy across devices, preserveDates
                copyJob.command = function(){ general.moveFile(workingPath, outputPath); };
            } else {
                copyJob.command = function(){ general.moveFile(workingPath, newFile); };
            }
        }
    });
    
    process.nextTick(function(){ queue.start(); });
    return queue;
};

function encodeCommand(inputFile, outputFile, handbrakeOptions, options){
    function command(){
        var commandHandle = new EventEmitter();
            
        // embed subtitles
        var srtPath = inputFile.replace(/\.\w+$/, "." + "srt");
        if (options["embed-srt"] && fs.existsSync(srtPath)){
            handbrakeOptions["srt-file"] = srtPath;
            commandHandle.emit("info", "embedding external subs: " + srtPath);
        }
        
        handbrakeOptions.i = inputFile;
        handbrakeOptions.o = outputFile;
    
        handbrake.run(handbrakeOptions)
            .on("progress", function(progress){ commandHandle.emit("progress", progress); })
            .on("terminated", function(){ commandHandle.emit("terminated"); })
            .on("complete", function(timer){ commandHandle.emit("complete", timer); })
            .on("output", function(data){ options.verbose && commandHandle.emit("info", data); })
            .on("error", function(err){ commandHandle.emit("error", err); });
         
        return commandHandle;
    }
    return command;
}

/**
@method info
@param {String|Array} files A single, or Array of filenames.
@param {Object} options 
@return {Queue} a Queue
@example 
Return info on all files beneath the "Music" directory:

    veelo.info(["Music"], { recurse: true })
        .on("info", function(info){
            console.log(info);
        })
*/
exports.info = function(options){
    var config = configMaster.apply("files", options);
    
    var files = config.get("files"),
        queue = new Queue();
    
    files.forEach(function(file){
        var job = new Job("get info for: " + file);
        job.command = function(){
            var output = new EventEmitter();
            handbrake.run({ i: file, scan: true}, function(stdout, stderr){
                output.emit("info", stderr);
            });
            return output;
        };
        queue.add(job);
    });
    
    return queue;
};


/**
@method help
@param {Object} options 
@param {Object} options.topic 
@param {Function} onComplete
@example
    veelo.help("Picture", function(help){
        console.log(help);
    });
*/
configMaster.add(
    "help",
    new Config().option("topic", { type: "string", valid: "encode|info|handbrake", default: "encode" })
);
exports.help = function(options, done){
    var config = configMaster.get("help", options);
    
    switch(config.get("topic")){
        case "encode":
            done(exports.usage);
            break;
        case "handbrake":
            handbrake.run({ h: true }, function(stdout, stderr){
                output += stdout.replace(/^.*$\n\n/m, "");
                done(output);
            });
            break;
    }
};

configMaster.add(
    "crud",
    new Config()
        .option("add", { type: "string", alias: "a" })
        .option("value", { type: "string", defaultOption: true })
        .option("remove", { type: "string", alias: "r" })
        .option("set", { type: "string" })
        .option("list", {type: "boolean" })
);
configMaster.add("defaults", "crud");
/**
Manage user defaults (stored in `~/.veelo.json`)
@method defaults
@param {Object} options 
@param {Object} options.add
@param {Object} options.remove
@chainable
@example
    veelo.defaults
        .add("srt-lang", "English")
        .remove("preset", "Android")
        .list();
*/
exports.defaults = function(options){
    var config = configMaster.apply("crud", options);
    
};

/**
Preset Management
@method preset
@chainable
@example
    veelo.preset.set("my phone", { rotate: 3, quality: 25 });
    veelo.preset.remove("preset");
    veelo.preset.list();
*/
configMaster.add("preset", "crud");
exports.preset = function(options){
    var config = configMaster.apply("crud", options);
};

/**

@method split
@return {Queue}
@example
    var queue = veelo.split("Goodbye Uncle Tom.avi", 900, { preset: "Normal" });
*/
configMaster.add(
    "splitSpecific",
    new Config()
        .option("length", {type: "number" })
);
configMaster.add("split", ["files", "splitSpecific", "handbrake"]);
exports.split = function(options){
    var config = configMaster.apply("split", options);
    
    
};

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

function version(){
    var packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8"));
    return packageJson.version
}

exports.parseCliCommand = function(){
   return configMaster.parseCli(
       ["encode", "info", "help", "defaults", "preset", "split", "collage"],
       { defaultCommand: "help"}
   );
};