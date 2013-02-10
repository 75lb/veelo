var assert = require("assert"),
    general = require("../lib/general"),
    ConfigMaster = require("../lib/config-master"),
    Config = require("../lib/config");

var _configMaster;
beforeEach(function(){
    _configMaster = new ConfigMaster();
});

describe("methods:", function(){
    it("add(name, configInstance) should be chainable, accept correct args, get(name) should return the added.", function(){
        var config = new Config()
        var output = _configMaster.add( "test", config );
        
        assert.strictEqual(_configMaster.get("test"), config);
        assert.strictEqual(output, _configMaster);
    });
    
    it("add(name, configName) should add a copy of configName", function(){
        var config1 = new Config()
            .group("whatever")
                .option("one", { default: 1, valid: /[0-9]/, type: "number" });
        var config2 = _configMaster
            .add("config1", config1 )
            .add("config2", "config1")
            .get("config2");

        assert.deepEqual(config1.definition("one"), config2.definition("one"));
    });

    it("add(name, [configNames]) should add a config with merged copies of configNames", function(){
        var config1 = new Config().option("one", { default: 1 });
        var config2 = new Config().option("two", { default: 2 });
        var config3 = _configMaster
            .add("config1", config1)
            .add("config2", config2)
            .add("config3", [ "config1", "config2" ])
            .get("config3");

        assert.deepEqual(config3.definition("one"), config1.definition("one"));
        assert.deepEqual(config3.definition("two"), config2.definition("two"));
        assert.deepEqual(config3.toJSON(), { one: 1, two: 2 });
    });
    
})
// configMaster.add(
//     "handbrake", 
//     new Config()
//         .group("general")
//             .option("input", { type: "string", alias: "i" })
//             .option("output", { type: "string", alias: "o" })
//         .group("source")
//             .option("title", { type: "number", alias: "t" })
//             .option("min-duration", { type: "number" })    
// );
// 
// configMaster.add(
//     "encode",
//     new Config()
//         .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", default: "m4v" })
//         .option("archive", { type: "boolean" })
//         .option("archiveDirectory", { type: "string", default: "veelo-originals" })
//         .option("output-dir", { type: "string" })
// );
// 
// configMaster.add(
//     "just-files", 
//      new Config()
//          .option("files", { 
//              type: "array",
//              required: true,
//              defaultOption: true,
//              valid: { pathExists: true }
//          })
// );
// 
// configMaster.add(
//     "help", 
//     new Config()
//         .option("topic", { type: "string", defaultOption: true, valid: "core|handbrake" })
// );
// 
// // add with these params is like an alias to one of more (merged) configs
// // merge process should throw on dupe option or alias name
// configMaster.add("encode", ["encode", "handbrake"]);
// configMaster.add("info", "just-files");
// 
// var cli = configMaster.parseCli(/*all commands*/);
// var cli = configMaster.parseCli(
//     ["encode", "info", "help"], 
//     { defaultCommand: "encode" }
// ); // returns CommandLine
// 
// veelo[cli.command](cli.options);
// 
// // or
// if (cli.command == "encode"){
//     veelo.encode(cli.options);
// }
// 
// // or
// veelo.encode({
//     files: ["this.txt"],
//     preset: "Normal",
//     ext: "mkv"
// });
// 
// // in function encode(options)
// handbrake.run(options);
// 
// // in handbrake.run(options)
// if (!options instanceof Config)
//     options = configMaster.get("handbrake", options);
// 
// // get()
// configMaster.get("handbrake"); // empty config
// config = configMaster.get("handbrake", values); // passing values
// config.get("preset");
// config.group("");
// 
// //  toConfig()
// config.group("handbrake").toConfig()
// 
// // apply options hash to config
// configMaster.apply("info", options);
// configMaster.apply(new Config(), options);