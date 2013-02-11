var assert = require("assert"),
    general = require("../lib/general"),
    ConfigMaster = require("../lib/config-master"),
    Config = require("../lib/config");

var _configMaster;
beforeEach(function(){
    _configMaster = new ConfigMaster();
});

describe("ConfigMaster", function(){
    describe("methods:", function(){
        it("add(name, configInstance) should be chainable, get(configName) should return the added.", function(){
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
        
        it("any other invocation of add() should throw");
        
        it("get(configName,  options) should return correct config with `options` hash values set", function(){
            var config = new Config()
                .option("one", { })
                .option("two", { });
            _configMaster.add("config", config);
            
            assert.throws(function(){
                var config2 = _configMaster.get("config", { one: "uno", two: "due", three: "tre" });
            });
            
            var config2 = _configMaster.get("config", { one: "uno", two: "due" });
            assert.deepEqual(config2.toJSON(), { one: "uno", two: "due" });
        });


        it("get(configName, configInstance) should return correct config with `options` hash values set", function(){
            var config = new Config()
                .option("one", { })
                .option("two", { });
            _configMaster.add("config", config);
            
            var config2 = new Config()
                .option("one", { default: -1 })
                .option("two", { default: -2 })
                .option("three", { default: -3 });

            assert.throws(function(){
                _configMaster.get("config", config2);
            });
            
            config.option("three", {});
            _configMaster.get("config", config2);
            
            assert.deepEqual(config.toJSON(), { one: -1, two: -2, three: -3 });
        });
        
        it("parseCommand([commandNames], commandArray) will parse the command and config from configName)", function(){
            var helpConfig = new Config()
                .option("listTopics", { type: "boolean", defaultOption: true })
                .option("topic", { type: "string" });

            var encodeConfig = new Config()
                .option("ext", { type: "string", default: "m4v" })
                .option("width", { type: "number", alias: "w" })
                .option("height", { type: "number", alias: "h" });
                
            _configMaster
                .add("help", helpConfig)
                .add("encode", encodeConfig);
            
            var command = _configMaster.parseCommand(
                ["help", "encode"], 
                {
                    defaultCommand: "help",
                    commandArrayToParse: ["node", "test.js"]
                }
            );
            
            assert.strictEqual(command.command, "help");
            assert.strictEqual(command.config, helpConfig);
            assert.strictEqual(command.config.get("listTopics"), true);

            var command = _configMaster.parseCommand(
                ["help", "encode"], 
                {
                    defaultCommand: "help",
                    commandArrayToParse: ["node", "test.js", "encode", "--width", "300", "-h", "200"]
                }
            );
            
            assert.strictEqual(command.command, "encode");
            assert.strictEqual(command.config, encodeConfig);
            assert.strictEqual(command.config.get("width"), 300);
            assert.strictEqual(command.config.get("w"), 300);
            assert.strictEqual(command.config.get("height"), 200);
            assert.strictEqual(command.config.get("h"), 200);
            
        });
    });
    
    
    
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
    // //  toConfig()
    // config.group("handbrake").toConfig()
    // 
});
