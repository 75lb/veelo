// module dependencies
var EventEmitter = require("events").EventEmitter,
    _ = require("underscore"),
    fs = require("fs"),
    util = require("util"),
    HandbrakeCLI = require("./handbrakeCli");
    Queue = require("./queue"),
    config = require("./config"),
    shared = require("../test/shared");

// exposed API
module.exports = Veelo;

// main class definition
function Veelo(){
    this.queue = new Queue();
};

Veelo.prototype = new EventEmitter();

Veelo.prototype.start = function(){
    var self = this;

    initConfig.call(this);
    var inputFiles = config.get("inputFiles");
    
    // user asks for help
    if (config.has(["help", "hbhelp"])) {
        getUsage(config.get("hbhelp"), function(usage){
            self.emit("message", usage);
        });
    
    // config
    } else if (config.has("config")){
        self.emit("message", util.inspect(config._definitions, false, null, true));
    
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

function initConfig(){
    var self = this;
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
            onInvalidJSON: function(err, configFilePath){
                self.emit("warning", "Fatal error parsing config: " + err + "\nPlease ensure this config file is valid JSON: " + configPath);
            }
        })
        .parseCliArgs({
            onInvalidArgs: function(invalid){
                self.emit("warning", "Invalid options: " + invalid.join(", "));
            }
        });
}