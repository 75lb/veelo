var assert = require("assert"),
    Config = require("../lib/config");

describe("Config", function(){
    describe("definition: ", function(){
        var config;
    
        beforeEach(function(){
            config = new Config();
        });
    
        it("should build config definition in groups", function(){
            config.option("top", {type: "string", default: "root" });
            config.group("veelo")
                    .option("version", {type: "boolean"});
            config.group("handbrake")
                    .subgroup("general")
                        .option("update", { type: "boolean" });
                   
            assert.deepEqual(
                config.definition, 
                {
                    top: {
                        type: "string",
                        default: "root"
                    },
                    veelo: {
                       version: {
                           type: "boolean"
                       }
                    },
                    handbrake: {
                       general: {
                           update: {
                               type: "boolean"
                           }
                       }
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
            config.group("veelo").set("archiveDirectory", "testset2");

            assert.equal(config.group("veelo").get("archiveDirectory"), "testset");
        });

        it("should return group size", function(){
            config.group("veelo")
                .option("one", {type: "boolean"})
                .option("two", {type: "boolean"})
                .option("three", {type: "boolean"});

            assert.equal(config.group("veelo").size, 3);
        });
        
        it("should handle invalid group/option names");
    });
    
    describe("defaults: ", function(){
        it("should apply defaults", function(){
            var config = new Config({
                defaults: {
                    test: "one", 
                    group: {
                        test: "two"
                    }
                }
            });
            
            assert.equal(config.get("test"), "one");
            assert.equal(config.group("group").get("test"), "two");
        });
        
    });
    
    describe("validation: ", function(){
        it("should validate string");
        it("should validate number");
        it("should validate regex");
        it("should validate boolean");
    });
});
