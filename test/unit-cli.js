var assert = require("assert"),
    cli = require("../lib/cli"),
    shared = require("../test/shared"),
    Config = require("../lib/config");

describe("cli", function(){
    describe("methods:", function(){
        var _commands = [
            { 
                command: "info", 
                config: new Config()
                    .option("recurse", { alias: "r", type: "boolean" })
                    .option("sort", { type: "string" })
                    .option("files", { 
                        type: "array",
                        required: true,
                        defaultOption: true,
                        valid: { pathExists: true }
                    })
            },
            {
                command: "help"
            },
            {
                command: "encode",
                config: new Config()
                    .option("width", { alias: "w", type: "number", default: 400 })
                    .option("height", { alias: "h", type: "number" })
            }
        ];
        
        it("parse(Array) should correctly parse config1 from a command array", function(){
            cli._inject(["node", "test.js", "info", "-r", "test_dir", "test_file.js", "--sort", "date"]);
            
            var cliValues = cli.parse(_commands);
            
            assert.deepEqual(cliValues, {
                command: "info", 
                options: {
                    recurse: true,
                    sort: "date",
                    files: [ "test_dir", "test_file.js" ]
                }
            });
        });

        it("parse(Array) should correctly parse config2 from a command array", function(){
            cli._inject(["node", "test.js", "help" ]);
            
            var cliValues = cli.parse(_commands);
            
            assert.deepEqual(cliValues, {
                command: "help",
                options: {}
            });
        });

        it("parse(Array) should correctly parse config3 from a command array", function(){
            cli._inject(["node", "test.js", "encode", "-w", "600", "--height", "1000"]);
            
            var cliValues = cli.parse(_commands);
            
            assert.deepEqual(cliValues, {
                command: "encode", 
                options: {
                    width: "600",
                    height: "1000"
                }
            });
        });
        
        it("parse(Array) should throw unless a defined command is passed", function(){
            cli._inject(["node", "test", "dflj", "file.js"]);
            
            assert.throws(function(){
                var cliValues = cli.parse([ { command: "work" } ]);
            });
        });

        it("parse(Array) should throw on undefined option", function(){
            cli._inject(["node", "test.js", "help", "-r"]);
            
            assert.throws(function(){
                var cliValues = cli.parse(_commands);
            });
        });

        it("parse(Array) should throw if unnamed values passed with no `defaultOption` specified", function(){
            cli._inject(["node", "test.js", "help", "file.txt", "file2.txt"]);
            
            assert.throws(function(){
                var cliValues = cli.parse(_commands);
            });
        });
        
        it("parse(Array) should throw on 'multiple commands passed'", function(){
            cli._inject(["node", "test.js", "encode", "help", "test_dir", "test_file.js", "-w", "600", "--height", "1000"]);

            assert.throws(function(){
                var cliValues = cli.parse(_commands);
            }); 
        });

        it("parse(Array) should throw on 'no command passed and no default specified'", function(){
            cli._inject(["node", "test.js"]);
            
            assert.throws(function(){
                var cliValues = cli.parse(_commands);
            });
        });

        it("parse(Array) should return default command if none passed", function(){
            cli._inject(["node", "test.js", "test_dir", "test_file.js", "-w", "600", "--height", "1000"]);
            
            var cliValues = cli.parse([
                { command: "one" },
                { 
                    command: "two", 
                    default: true,
                    config: new Config()
                        .option("width", { alias: "w", type: "number", default: 400 })
                        .option("height", { alias: "h", type: "number" })
                        .option("files", { type: "array", defaultOption: true })
                },
                { command: "three" }
            ]);
            
            assert.deepEqual(cliValues, {
                command: "two"
            });
        });
        
        it("parse(Object) should correctly parse cli with the specified config spec");
        it("parse(Object) should throw error on invalid option");
        
        // it("parse(Object) should not accept the next option as a value", function(){
        //     cli._inject(["node", "blah.js", "the-file.mov", "--output-dir", "--version", "--verbose"]);
        //     
        //     var cliValues = cli.parse(
        //         new Config()
        //             .option("version", { type: "boolean" })
        //             .option("output-dir", { type: "string", alias: "o" })
        //             .option("verbose", { type: "boolean", alias: "v" })
        //      );
        //      
        //     assert.deepEqual(
        //         cliValues,
        //         {
        //             files: ["the-file.mov"], 
        //             options: {
        //                 "output-dir": "",
        //                 version: true,
        //                 verbose: true
        //             }
        //         }
        //     );
        // });
        
    });
});