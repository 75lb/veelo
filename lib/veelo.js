/**
 * The Video Library Optimisation (V-LO) tool.
 * @file veelo.js
 * @copyright 2012-2013 Lloyd Brookes
 */
 
var EventEmitter = require("events").EventEmitter,
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    _ = require("underscore"),
    HandbrakeCLI = require("./handbrakeCli"),
    Queue = require("./queue"),
    config = require("./config"),
    shared = require("../test/shared");

// privates
var e = {
    msg: "message",
    report: "report",
    warning: "warning"
};

/** @exports veelo */
var veelo = new EventEmitter();

/** configuration */
veelo.config = config;

function initQueue(){

    /** direct access to the queue */
    veelo.queue = new Queue();
    
    veelo.queue.on("begin", function(){
        veelo.emit("queue-starting");
    });
    veelo.queue.on("handbrake-output", function(hbOp){
        if (/Encoding:/.test(hbOp)){
            var match = hbOp.match(/task 1 of 1, (.*) %( \((.*?) fps, avg (.*?) fps, ETA (.*?)\))?/);
            veelo.emit("job-progress", {
                percentComplete: match[1],
                fps: +match[3],
                avgFps: +match[4],
                eta: match[5]
            });
        }
    });
}

initQueue();

/**
 * Add a file or array of files to the queue.
 * @public
 * @method
 */
veelo.add = function add(file){
    veelo.queue.add(file);
    return veelo;
};

/**
 * Clear the queue
 */
veelo.clear = function clear(){
    initQueue();
    return veelo;
};

/**
 * Start processing
 * @fires veelo#message
 */
veelo.start = function start(){
    // user asks for help
    if (config.has(["help", "hbhelp"])) {
        getUsage(config.get("hbhelp"), function(usage){
            veelo.emit("message", usage);
        });

    // config
    } else if (config.has("config")){
        veelo.emit("message", config._getActive().map(function(item){
            return item.name + ": " + item.value;
        }));
    
    // version number
    } else if (config.get("version")){
        var packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8"));
        if (packageJson.version){
            veelo.emit("message", packageJson.version);
        }
    
    // user passes options that don't require files
    } else if (config.has(["preset-list", "update"])) {
        var handbrakeCLI = new HandbrakeCLI();
        handbrakeCLI.exec({ handbrakeArgs: config.group("handbrake").toJSON() }, function(stdout, stderr){
            veelo.emit("message", stdout + stderr);
        });

    // user passes files
    } else if (veelo.queue.stats.valid > 0){

        // custom preset
        if (config.has("preset")){
            var preset = config.get("preset"),
                udp = config.get("user-defined-presets")[preset];
            
            if (udp !== undefined){
                config.unset("preset");
                config.set(udp);
            }
        }

        // certain commands depend on --verbose
        if (config.has(["title", "scan"])){
            config.set("verbose", true);
        }

        // --dry-run
        if (config.has("dry-run")){
            veelo.emit("report", veelo.queue.getReport());
            veelo.queue.cancel();
        } else {
            veelo.queue.process();
        }
    
    // everything else is invalid usage
    } else {
        veelo.emit("message", veelo.usage);
    }
};


veelo._inject = function _inject(MockQueue){
    Queue = MockQueue;
    initQueue();
}

veelo.usage = 
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

// internal implementation functions
function getUsage(includeHandbrakeOpts, done){
    var output = veelo.usage;
    if (includeHandbrakeOpts){
        var handbrakeCLI = new HandbrakeCLI();
        handbrakeCLI.exec({ handbrakeArgs: { h: true }}, function(stdout, stderr){
            output += stdout.replace(/^.*$\n\n/m, "");
            done(output);
        });
    } else {
        done(output);
    }
}

// init config
config
    .group("veelo")
        .option("help", { type: "boolean", alias: "h" })
        .option("hbhelp", { type: "boolean" })
        .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", defaultVal: "m4v" })
        .option("archive", { type: "boolean" })
        .option("archiveDirectory", { type: "string", defaultVal: "veelo-originals" })
        .option("verbose", { type: "boolean", alias: "v" })
        .option("version", { type: "boolean" })
        .option("config", { type: "boolean" })
        .option("embed-srt", { type: "boolean" })
        .option("preserve-dates", { type: "boolean" })
        .option("recurse", { type: "boolean" })
        .option("dry-run", { type: "boolean" })
        .option("output-dir", { type: "string" })
        .option("include", { type: "regex" })
        .option("exclude", { type: "regex" })
        .option("ignoreList", { type: "array", defaultVal: [] })
        .option("user-defined-presets", { type: "object" })
    .group("handbrake")
        .subgroup("general")
            .option("update", { type: "boolean", alias: "u" })
            .option("preset", { type: "string", alias: "Z" })
            .option("preset-list", { type: "boolean", alias: "z" })
            .option("no-dvdnav", { type: "boolean" })
        .subgroup("source")
            .option("title", { type: "number", alias: "t" })
            .option("min-duration", { type: "number" })
            .option("scan", { type: "boolean" })
            .option("main-feature", { type: "boolean" })
            .option("chapters", { type: "string", alias: "c" })
            .option("angle", { type: "number" })
            .option("previews", { type: "string" })
            .option("start-at-preview", { type: "string" })
            .option("start-at", { type: "string" })
            .option("stop-at", { type: "string" })
        .subgroup("destination")
            .option("format", { type: "string", alias: "f" })
            .option("markers", { type: "boolean", alias: "m" })
            .option("large-file", { type: "boolean", alias: "4" })
            .option("optimize", { type: "boolean", alias: "O" })
            .option("ipod-atom", { type: "boolean", alias: "I" })
        .subgroup("video")            
            .option("encoder", { type: "string", alias: "e" })
            .option("x264-preset", { type: "string" })
            .option("x264-tune", { type: "string" })
            .option("encopts", { type: "string", alias: "x" })
            .option("x264-profile", { type: "string" })
            .option("quality", { type: "number", alias: "q" })
            .option("vb", { type: "number", alias: "b" })
            .option("two-pass", { type: "boolean", alias: "2" })
            .option("turbo", { type: "boolean", alias: "T" })
            .option("rate", { type: "float", alias: "r" })
            .option("vfr", { type: "boolean" })
            .option("cfr", { type: "boolean" })
            .option("pfr", { type: "boolean" })
        .subgroup("audio")            
            .option("audio", { type: "string", alias: "a" })
            .option("aencoder", { type: "string", alias: "E" })
            .option("audio-copy-mask", { type: "string" })
            .option("audio-fallback", { type: "string" })
            .option("ab", { type: "string", alias: "B" })
            .option("aq", { type: "string", alias: "Q" })
            .option("ac", { type: "string", alias: "C" })
            .option("mixdown", { type: "string", alias: "6" })
            .option("arate", { type: "string", alias: "R" })
            .option("drc", { type: "float", alias: "D" })
            .option("gain", { type: "float" })
            .option("aname", { type: "string", alias: "A" })
        .subgroup("picture")            
            .option("width", { type: "number", alias: "w" })
            .option("height", { type: "number", alias: "l" })
            .option("crop", { type: "string" })
            .option("loose-crop", { type: "number" })
            .option("maxHeight", { type: "number", alias: "Y" })
            .option("maxWidth", { type: "number", alias: "X" })
            .option("strict-anamorphic", { type: "boolean" })
            .option("loose-anamorphic", { type: "boolean" })
            .option("custom-anamorphic", { type: "boolean" })
            .option("display-width", { type: "number" })
            .option("keep-display-aspect", { type: "boolean" })
            .option("pixel-aspect", { type: "string" })
            .option("itu-par", { type: "boolean" })
            .option("modulus", { type: "number" })
            .option("color-matrix", { type: "string", alias: "M" })
        .subgroup("filters")
            .option("deinterlace", { type: "string", alias: "d" })
            .option("decomb", { type: "string", alias: "5" })
            .option("detelecine", { type: "string", alias: "9" })
            .option("denoise", { type: "string", alias: "8" })
            .option("deblock", { type: "string", alias: "7" })
            .option("rotate", { type: "number" })
            .option("grayscale", { type: "boolean", alias: "g" })
        .subgroup("subtitle")
            .option("subtitle", { type: "string", alias: "s" })
            .option("subtitle-forced", { type: "number" })
            .option("subtitle-burn", { type: "number" })
            .option("subtitle-default", { type: "number" })
            .option("native-language", { type: "string", alias: "N" })
            .option("native-dub", { type: "boolean" })
            .option("srt-file", { type: "string" })
            .option("srt-codeset", { type: "string" })
            .option("srt-offset", { type: "string" })
            .option("srt-lang", { type: "string" })
            .option("srt-default", { type: "number" })
    .parseConfigFile({
        onInvalidJSON: function(err, configPath){
            veelo.emit(
                "warning", 
                "Fatal error parsing config: " + err + 
                "\nPlease ensure this config file is valid JSON: " + configPath
            );
        }
    });

module.exports = veelo;

/**
 * @event veelo#message
 * @type {object}
 * @property {string} msg - the message
 */

/**
 * Fired when processing begins
 * @event veelo#queue-starting
 */
