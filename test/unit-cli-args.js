var assert = require("assert"),
    cli = require("../lib/cli-args");

describe("cli-args", function(){
    // var optionDefinitions = {
    //     version: {type: "boolean"},
    //     "output-dir": { type: "string", alias: "o" },
    //     other: {type: "string"},
    //     another: {type: "number"}
    // };
    
    var optionDefinitions = {
        version: { type: "boolean" },
    	"output-dir": { type: "string" },
        other: {type: "string"},
        another: {type: "number"},
        o: "output-dir"
    };

    it("should correctly parse args", function(){
        cli._inject([
            "node", "/usr/bin/blah",
            "file.js", "--version", "-o", "./testdir", "file2.mov"
        ]);
        
        var args = cli.getArgs(optionDefinitions);
        assert.deepEqual(
            args,
            {
                files: ["file.js", "file2.mov"],
                args: {
                    version: true,
                    "output-dir": "./testdir"
                },
                invalid: []
            }, 
            JSON.stringify(args)
        );
    });
    
    it("should reject invalid options", function(){
        cli._inject(["node", "/blah/blah", "--ridiculous", "words", "-t", "-a"]);
        
        var args = cli.getArgs(optionDefinitions);
        assert.deepEqual(
            args,
            { files: ["words"], args: {}, invalid: ["--ridiculous", "-t", "-a"] },
            JSON.stringify(args)
        );
    });
});