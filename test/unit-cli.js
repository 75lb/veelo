var assert = require("assert"),
    cli = require("../lib/cli"),
    shared = require("../test/shared"),
    Config = require("../lib/config");

describe("cli", function(){
    describe("methods:", function(){
        it("parse(Array) should correctly parse an array of commands", function(){
            cli._inject(["node", "test.js", "info", "-r", "test_dir", "test_file.js", "--sort", "date"]);
            
            var cliValues = cli.parse([
                { 
                    command: "info", 
                    config: new Config()
                        .option("recurse", { alias: "r", type: "boolean" })
                        .option("sort", { type: "string" })
                }
            ]);
            
            assert.deepEqual(cliValues, {
                command: "info", 
                files: [ "test_dir", "test_file.js" ],
                options: {
                    recurse: true,
                    sort: "date"
                }
            });
        });
        
        it("parse(Array) should throw unless a defined command is passed", function(){
            cli._inject(["node", "test", "dflj", "file.js"]);
            
            assert.throws(function(){
                var cliValues = cli.parse([ { command: "test" } ]);
            });
        });
        
        it("parse(Array) should throw on 'multiple commands passed'");
        it("parse(Array) should throw on 'no command passed and no default specified'");
        it("parse(Array) should throw on undefined option");
        it("parse(Object) should correctly parse cli with the specified config spec");
        it("parse(Object) should throw error on invalid option");
        
        it("parse(Object) should not accept the next option as a value", function(){
            cli._inject(["node", "blah.js", "the-file.mov", "--output-dir", "--version", "--verbose"]);
            
            var cliValues = cli.parse(
                new Config()
                    .option("version", { type: "boolean" })
                    .option("output-dir", { type: "string", alias: "o" })
                    .option("verbose", { type: "boolean", alias: "v" })
             );
             
            assert.deepEqual(
                cliValues,
                {
                    files: ["the-file.mov"], 
                    options: {
                        "output-dir": "",
                        version: true,
                        verbose: true
                    }
                }
            );
        });
        
    });
});