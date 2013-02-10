var assert = require("assert"),
    general = require("../lib/general"),
    Config = require("../lib/config");

function l(msg){ general.log(msg); }

describe("Config", function(){
    var _config;
    beforeEach(function(){
        _config = new Config();
    });

    describe("basics: ", function(){
        it("should set/get option", function(){
            _config.option("archiveDirectory", { type: "string", alias: "d" });
            _config.set("archiveDirectory", "testset");

            assert.equal(_config.get("archiveDirectory"), "testset");
        });

        it("should set/get option alias", function(){
            _config.option("archiveDirectory", { type: "string", alias: "d" });
            _config.set("d", "testset");

            assert.equal(_config.get("d"), "testset");
        });

        it("should set/get option within specific group", function(){
            _config.group("veelo").option("archiveDirectory", {type: "string"});
            _config.set("archiveDirectory", "testset2");

            assert.equal(_config.get("archiveDirectory"), "testset2");
        });

        it("should set default option value", function(){
            _config.option("one", {type: "number", default: 1 });
            
            assert.strictEqual(_config.get("one"), 1);
        });

        it("should return group size", function(){
            _config.group("veelo")
                .option("one", {type: "boolean"})
                .option("two", {type: "boolean"})
                .option("three", {type: "boolean"});

            assert.strictEqual(_config.group("veelo").size(), 3);
        });

        it("should throw on invalid option get", function(){
            assert.throws(function(){
                _config.get("asdf", 0);
            }, Error);
        });
        
        it("should throw on invalid option set", function(){
            assert.throws(function(){
                _config.set("asdf", 0);
            }, Error);
        });
        
        it("should output group toJson", function(){
            _config.group("testgroup")
                .option("one", {})
                .option("two", {})
                .option("three", {})
                .set("one", 1)
                .set("two", 2)
                .set("three", 3);
            
            assert.deepEqual(
                _config.group("testgroup").toJSON(),
                {
                    one: 1,
                    two: 2,
                    three: 3
                }
            );
        });

        it("should output group and subgroup toJson", function(){
            _config.group("testgroup")
                .option("one", {})
                .set("one", 1)
                .subgroup("sub")
                    .option("two", {})
                    .option("three", {})
                    .set("two", 2)
                    .set("three", 3);
            
            assert.deepEqual(
                _config.group("testgroup").toJSON(),
                {
                    one: 1,
                    two: 2,
                    three: 3
                }
            );
            assert.deepEqual(
                _config.group("testgroup").subgroup("sub").toJSON(),
                {
                    two: 2,
                    three: 3
                }
            );
        });
        
        it("has() should return true if option has value", function(){
            _config.option("one", {});
            _config.set("one", 1);
            
            assert.strictEqual(_config.hasValue("one"), true);
            
        });

        it("has() should return false if option has no value", function(){
            _config.option("one", {});
            
            assert.strictEqual(_config.hasValue("one"), false);
        });
        
        it("should unset an option, and its alias", function(){
            _config.option("one", {type: "number", default: 1, alias: "K" });
            assert.strictEqual(_config.get("one"), 1);
            assert.strictEqual(_config.get("K"), 1);
            _config.unset("one");
            assert.strictEqual(_config.get("one"), undefined);            
            assert.strictEqual(_config.get("K"), undefined);
        });
        
        it("should set options in bulk", function(){
            _config.option("one", { type: "number", alias: "1" })
                .option("two", { type: "number", alias: "t" })
                .option("three", { type: "number", alias: "3" });
            
            assert.strictEqual(_config.get("one"), undefined);
            assert.strictEqual(_config.get("t"), undefined);
            assert.strictEqual(_config.get("3"), undefined);

            _config.set({
                one: 1,
                "t": 2,
                "3": 3
            });
            
            assert.strictEqual(_config.get("one"), 1);
            assert.strictEqual(_config.get("two"), 2);
            assert.strictEqual(_config.get("three"), 3);
        });

        it("should report if get/set ambiguous name");
        it("should set aliassed option too when setting alias");
        it("should list defined options");
    });
    
    describe("methods: ", function(){
        it("definition() should return correctly", function(){
            _config.option("one", { type: "string", default: 1, alias: "1"})

            assert.deepEqual(
                _config.definition("one"), 
                { type: "string", default: 1, alias: "1", value: 1, group: "" }
            );
        });
        
        it("should clone()", function(){
            _config.option("one", { default: 1 })
                .option("two", { default: 2 });
            
            var config2 = _config.clone();

            assert.notStrictEqual(_config, config2);
            assert.deepEqual(_config.definition("one"), config2.definition("one"), config2);
            assert.deepEqual(_config.definition("two"), config2.definition("two"), config2);
        });
        
        it("options() should return Array of option names");
        
        it("mixin(config) should work", function(){
            _config.option("year", { type: "number", default: 2013 });
            var config2 = new Config().option("month", { type: "string", default: "feb" });
            var config3 = new Config().option("day", { type: "string", default: "Sunday" })
            
            _config.mixIn(config2);
            _config.mixIn(config3);
            
            assert.strictEqual(_config.get("year"), 2013);
            assert.strictEqual(_config.get("month"), "feb");
            assert.strictEqual(_config.get("day"), "Sunday");
        });
    });
        
    describe("validation: ", function(){
        it("should validate string");
        it("should validate number");
        it("should validate regex");
        it("should validate boolean");
    });
});
