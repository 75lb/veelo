var assert = require("assert"),
    cli = require("../lib/cli-args");

describe("cli-args", function(){
    it("should return passed-in arg-value pairs", function(){
        cli._inject([
            "node", "/usr/bin/blah",
            "file.js", "--version", "-o", "./testdir", "file2.mov"
        ]);
        var optionDefinitions = {
            version: {type: "boolean"},
            "output-dir": { type: "string", alias: "o" },
            other: {type: "string"},
            another: {type: "number"}
        };
        
        var args = cli.getArgs(optionDefinitions);
        console.log(args);
        assert.deepEqual(
            args,
            {
                files: ["file.js", "file2.mov"],
                args: {
                    version: true,
                    "output-dir": "./testdir"
                }
            }, 
            JSON.stringify(args)
        );
    });
});