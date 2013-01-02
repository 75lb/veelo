// module dependencies
var EventEmitter = require("events").EventEmitter,
    _ = require("underscore"),
    fs = require("fs"),
    util = require("util"),
    HandbrakeCLI = require("./handbrakeCli");
    Queue = require("./queue"),
    config = require("./config");

// exposed API
module.exports = Veelo;

// main class definition
function Veelo(){
    initConfig();
    this.queue = new Queue();
};

Veelo.prototype = new EventEmitter();

Veelo.prototype.start = function(){
    var self = this,
        inputFiles = config.get("inputFiles");
    
    // user asks for help
    if (config.has(["help", "hbhelp"])) {
        getUsage(config.get("hbhelp"), function(usage){
            self.emit("message", usage);
        });
    
    // // config
    // } else if (config.has("config")){
    //     console.log(util.inspect(config.defaults.external, false, null, true));
    
    // version number
    } else if (config.get("version")){
        var packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
        if (packageJson.version){
            self.emit("message", packageJson.version);
        }
    
    // user passes options that don't require files
    } else if (config.has(["preset-list", "update"])) {
        var handbrakeCLI = new HandbrakeCLI();
        handbrakeCLI.exec({ handbrakeArgs: config.group("handbrake").toJSON() }, function(stdout, stderr){
            self.emit("message", stdout + stderr);
        });

    // user passes files
    } else if (inputFiles.length > 0){
        this.queue.add(inputFiles);

        // custom preset
        if (config.has("preset")){
            var preset = config.get("preset");
            if (config.presets[preset] !== undefined){
                delete config.options.handbrake.preset;
                delete config.options.handbrake.Z;
                _.extend(config.options.handbrake, config.presets[preset].handbrake);
                _.extend(config.options.veelo, config.presets[preset].veelo);
                // console.log(util.inspect(config.options, false, null, true));
            }
        }

        // certain commands depend on --verbose
        if (config.has(["title", "scan"])){
            config.set("verbose", true);
        }

        // --dry-run
        if (config.has("dry-run")){
            this.emit("report", this.queue.getReport());
            this.queue.cancel();
        } else {
            this.queue.process();
        }
    
    // everything else is invalid usage
    } else {
        self.emit("message", Veelo.usage);
    }
};

Veelo.usage = 
"\nUsage: veelo [options] [HandbrakeCLI options] [files]\n\n" +
"### Veelo Options-------------------------------------------------------\n" + 
"        --ext <string>         Output file extension (implicitly sets container format). Choose 'mp4', 'm4v' or 'mkv'.\n" +
"        --archive              Archive the original file to a specified directory (default: 'veelo-originals')\n" +
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
            
// // Video Options
// { name: "encoder", alias: "e", type: "string" },
// { name: "x264-preset", type: "string" },
// { name: "x264-tune", type: "string" },
// { name: "encopts", alias: "x", type: "string" },
// { name: "x264-profile", type: "string" },
// { name: "quality", alias: "q", type: "number" },
// { name: "vb", alias: "b", type: "number" },
// { name: "two-pass", alias: "2", type: "boolean" },
// { name: "turbo", alias: "T", type: "boolean" },
// { name: "rate", alias: "r", type: "float" },
// { name: "vfr", type: "boolean" },
// { name: "cfr", type: "boolean" },
// { name: "pfr", type: "boolean" },
// 
// // Audio options
// { name: "audio", alias: "a", type: "string" },
// { name: "aencoder", alias: "E", type: "string" },
// { name: "audio-copy-mask", type: "string" },
// { name: "audio-fallback", type: "string" },
// { name: "ab", alias: "B", type: "string" },
// { name: "aq", alias: "Q", type: "string" },
// { name: "ac", alias: "C", type: "string" },
// { name: "mixdown", alias: "6", type: "string" },
// { name: "arate", alias: "R", type: "string" },
// { name: "drc", alias: "D", type: "float" },
// { name: "gain", type: "float" },
// { name: "aname", alias: "A", type: "string" },
// 
// // Picture options
// { name: "width", alias: "w", type: "number" },
// { name: "height", alias: "l", type: "number" },
// { name: "crop", type: "string" },
// { name: "loose-crop", type: "number" },
// { name: "maxHeight", alias: "Y", type: "number" },
// { name: "maxWidth", alias: "X", type: "number" },
// { name: "strict-anamorphic", type: "boolean" },
// { name: "loose-anamorphic", type: "boolean" },
// { name: "custom-anamorphic", type: "boolean" },
// { name: "display-width", type: "number" },
// { name: "keep-display-aspect", type: "boolean" },
// { name: "pixel-aspect", type: "string" },
// { name: "itu-par", type: "boolean" },
// { name: "modulus", type: "number" },
// { name: "color-matrix", alias: "M", type: "string" },
// 
// // Filters
// { name: "deinterlace", alias: "d", type: "string" },
// { name: "decomb", alias: "5", type: "string" },
// { name: "detelecine", alias: "9", type: "string" },
// { name: "denoise", alias: "8", type: "string" },
// { name: "deblock", alias: "7", type: "string" },
// { name: "rotate", type: "number" },
// { name: "grayscale", alias: "g", type: "boolean" },
// 
// // Subtitle Options
// { name: "subtitle", type: "string", alias: "s" },
// { name: "subtitle-forced", type: "string", alias: "F" },
// { name: "subtitle-burn", type: "number" },
// { name: "subtitle-default", type: "number" },
// { name: "native-language", type: "string", alias: "N" },
// { name: "native-dub", type: "boolean" },
// { name: "srt-file", type: "string" },
// { name: "srt-codeset", type: "string" },
// { name: "srt-offset", type: "string" },
// { name: "srt-lang", type: "string" },
// { name: "srt-default", type: "number" }

// internal implementation functions
function getUsage(includeHandbrakeOpts, done){
    var output = Veelo.usage;
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

Veelo.initConfig = initConfig;
function initConfig(){
    config
        .group("veelo")
            .option("help", { type: "boolean", alias: "h" })
            .option("hbhelp", { type: "boolean" })
            .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", default: "m4v" })
            .option("archive", { type: "boolean" })
            .option("archiveDirectory", { type: "string", default: "veelo-originals" })
            .option("verbose", { type: "boolean" })
            .option("version", { type: "boolean" })
            .option("config", { type: "boolean" })
            .option("embed-srt", { type: "boolean" })
            .option("preserve-dates", { type: "boolean" })
            .option("recurse", { type: "boolean" })
            .option("dry-run", { type: "boolean" })
            .option("output-dir", { type: "string" })
            .option("include", { type: "regex" })
            .option("exclude", { type: "regex" })
            .option("ignoreList", { type: "array", default: [] })
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
                .option("ipod-atom", { type: "boolean", alias: "I" });
        
    config.parseCliArgs();
}