var assert = require("assert"),
    config = require("../lib/config");

function l(msg){ 
    var util = require("util");
    console.log(util.inspect(msg, true, null, true));
}


describe("Config", function(){
    describe("basics: ", function(){

        beforeEach(function(){
            config.reset();
        });

        it("should build config definition in groups", function(){
            config.option("top", {type: "string" });
            config.group("veelo")
                    .option("version", {type: "boolean", alias: "v"});
            config.group("handbrake")
                    .subgroup("general")
                        .option("update", { type: "boolean" });

            assert.deepEqual(
                config._definitions,
                {
                    top: {
                        type: "string",
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
                JSON.stringify(config._definitions)
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

        it("should set default option value", function(){
            config.option("one", {type: "number", default: 1 });
            
            assert.strictEqual(config.get("one"), 1);
        });

        it("should return group size", function(){
            config.group("veelo")
                .option("one", {type: "boolean"})
                .option("two", {type: "boolean"})
                .option("three", {type: "boolean"});

            assert.equal(config.group("veelo").size(), 3);
        });

        // it("should return undefined on invalid get", function(){
        //     assert.strictEqual(config.get("ldfjd"), undefined);
        // });

        it("should throw on invalid option get", function(){
            assert.throws(function(){
                config.get("asdf", 0);
            }, Error);
        });
        
        it("should throw on invalid option set", function(){
            assert.throws(function(){
                config.set("asdf", 0);
            }, Error);
        });
        
        it("should output group toJson", function(){
            config.group("testgroup")
                .option("one", {})
                .option("two", {})
                .option("three", {})
                .set("one", 1)
                .set("two", 2)
                .set("three", 3);
            
            assert.deepEqual(
                config.group("testgroup").toJSON(),
                {
                    one: 1,
                    two: 2,
                    three: 3
                }
            );
        });

        it("should output group and subgroup toJson", function(){
            config.group("testgroup")
                .option("one", {})
                .subgroup("sub")
                    .option("two", {})
                    .option("three", {})
                .set("one", 1)
                .set("two", 2)
                .set("three", 3);
            
            assert.deepEqual(
                config.group("testgroup").toJSON(),
                {
                    one: 1,
                    two: 2,
                    three: 3
                }
            );
            assert.deepEqual(
                config.group("testgroup").subgroup("sub").toJSON(),
                {
                    two: 2,
                    three: 3
                }
            );
        });
        
        it("should report if get/set ambiguous name");
        
        it("has() should return true if option has value", function(){
            config.option("one", {});
            config.set("one", 1);
            
            assert.strictEqual(config.has("one"), true);
            
        });

        it("has() should return false if option has no value", function(){
            config.option("one", {});
            
            assert.strictEqual(config.has("one"), false);
        });
    });
        
    describe("validation: ", function(){
        it("should validate string");
        it("should validate number");
        it("should validate regex");
        it("should validate boolean");
    });
});
