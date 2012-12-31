var assert = require("assert"),
    config = require("../lib/config");

function l(msg){ 
    var util = require("util");
    console.log(util.inspect(msg, true, null, true));
}


describe("Config", function(){
    describe("definition: ", function(){
    
        beforeEach(function(){
            config.reset();
        });

        it("should build config definition in groups", function(){
            config.option("top", {type: "string", default: "root" });
            config.group("veelo")
                    .option("version", {type: "boolean", alias: "v"});
            config.group("handbrake")
                    .subgroup("general")
                        .option("update", { type: "boolean" });

            assert.deepEqual(
                config.definition, 
                {
                    top: {
                        type: "string",
                        default: "root",
                        group: ""
                    },
                   version: {
                       type: "boolean",
                       group: "veelo"
                   },
                   v: "version",
                   update: {
                       type: "boolean",
                       group: "handbrake.general"
                   }
                },
                JSON.stringify(config.definition)
            );
            
        });

        it("should set/get option", function(){
            config.option("archiveDirectory", {type: "string"});
            config.set("archiveDirectory", "testset");

            assert.equal(config.get("archiveDirectory"), "testset");
        });

        it("should set/get option within specific group", function(){
            config.group("veelo").option("archiveDirectory", {type: "string"});
            config.set("archiveDirectory", "testset2");

            assert.equal(config.get("archiveDirectory"), "testset2");
        });

        it("should return group size", function(){
            config.group("veelo")
                .option("one", {type: "boolean"})
                .option("two", {type: "boolean"})
                .option("three", {type: "boolean"});

            assert.equal(config.group("veelo").size(), 3);
        });

        it("should handle invalid group/option names");
        it("should output group toJson, e.g. config.getGroup('external defaults') or config.getGroup('handbrake')");
        it("should fail to set unspecified option");
        it("should fail to get unspecified option");
        it("should report if get/set ambiguous name");
        it("should return true if 'has' option");
    });
        
    describe("validation: ", function(){
        it("should validate string");
        it("should validate number");
        it("should validate regex");
        it("should validate boolean");
    });
});
