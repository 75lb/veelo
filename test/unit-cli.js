var assert = require("assert"),
    cli = require("../lib/cli"),
    shared = require("../test/shared"),
    Config = require("../lib/config");

// describe("cli-args", function(){
//     // var optionDefinitions = {
//     //     version: {type: "boolean"},
//     //     "output-dir": { type: "string", alias: "o" },
//     //     other: {type: "string"},
//     //     another: {type: "number"}
//     // };
//     
//     var optionDefinitions = {
//         version: { type: "boolean" },
//         "output-dir": { type: "string" },
//         o: "output-dir",
//         other: {type: "string"},
//         another: {type: "number"},
//         verbose: {type: "boolean"},
//         "v": "verbose"
//     };
// 
//     it("should correctly parse args", function(){
//         cli._inject([
//             "node", "/usr/bin/blah",
//             "file.js", "--version", "-o", "./testdir", "file2.mov", "-v"
//         ]);
//         
//         var args = cli.getArgs(optionDefinitions);
//         assert.deepEqual(
//             args,
//             {
//                 files: ["file.js", "file2.mov"],
//                 args: {
//                     version: true,
//                     "output-dir": "./testdir",
//                     verbose: true
//                 },
//                 invalid: []
//             }, 
//             JSON.stringify(args)
//         );
//     });
//     
//     it("should reject invalid options", function(){
//         cli._inject(["node", "/blah/blah", "--ridiculous", "words", "-t", "-a"]);
//         
//         var args = cli.getArgs(optionDefinitions);
//         assert.deepEqual(
//             args,
//             { files: ["words"], args: {}, invalid: ["--ridiculous", "-t", "-a"] },
//             JSON.stringify(args)
//         );
//     });
//     
//     it("should not accept the next option as a value", function(){
//         cli._inject(["node", "blah.js", "the-file.mov", "--output-dir", "--version", "--verbose"]);
//         var args = cli.getArgs(optionDefinitions);
//         
//         assert.deepEqual(
//             args,
//             {
//                 files: ["the-file.mov"], 
//                 args: {
//                     "output-dir": "",
//                     version: true,
//                     verbose: true
//                 },
//                 invalid: []
//             }
//         );
//     });
// });

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
        
        it("parse(Array) should throw on undefined command passed", function(){
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
    });
});