var configMaster = require("../lib/config-master");

configMaster.add(
    "handbrake", 
    new Config()
        .group("general")
            .option("input", { type: "string", alias: "i" })
            .option("output", { type: "string", alias: "o" })
        .group("source")
            .option("title", { type: "number", alias: "t" })
            .option("min-duration", { type: "number" })    
);

configMaster.add(
    "encode",
    new Config()
        .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", default: "m4v" })
        .option("archive", { type: "boolean" })
        .option("archiveDirectory", { type: "string", default: "veelo-originals" })
        .option("output-dir", { type: "string" })
);

configMaster.add(
    "just-files", 
     new Config()
         .option("files", { 
             type: "array",
             required: true,
             defaultOption: true,
             valid: { pathExists: true }
         })
);

configMaster.add(
    "help", 
    new Config()
        .option("topic", { type: "string", defaultOption: true, valid: "core|handbrake" })
);

// add with these params is like an alias to one of more (merged) configs
// merge process should throw on dupe option or alias name
configMaster.add("encode", ["encode", "handbrake"]);
configMaster.add("info", "just-files");

var cli = configMaster.parseCli(/*all commands*/);
var cli = configMaster.parseCli("encode", "info", "help");

veelo[cli.command](cli.options);

// or
if (cli.command == "encode"){
    veelo.encode(cli.options);
}

// or
veelo.encode({
    files: ["this.txt"],
    preset: "Normal",
    ext: "mkv"
});

// in function encode(options)
handbrake.run(options);

// in handbrake.run(options)
if (!options instanceof Config)
    options = configMaster.get("handbrake", options);

// get()
configMaster.get("handbrake"); // empty config
config = configMaster.get("handbrake", values); // passing values
config.get("preset");
config.group("");

//  toConfig()
config.group("handbrake").toConfig()