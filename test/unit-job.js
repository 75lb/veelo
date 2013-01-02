var assert = require("assert"),
    path = require("path"),
    os = require("os"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    sinon = require("sinon"),
    fs = require("fs-extra"),
    Job = require("../lib/job"),
    config = require("../lib/config"),
    HandbrakeCLI = require("../lib/handbrakeCli"),
    shared = require("./shared");

describe("Job", function(){
    var p = shared.path,
        inputPath = path.join(p.FIXTURE_DIR, p.VIDEO1);
    
    before(function(done){
        shared.setupSingleFileFixture(p.VIDEO1, done);
    });
    beforeEach(function(){
        config.reset();
        config.group("veelo")
            .option("ext", { type: "string", valid: "\.mp4|\.m4v|\.mkv", default: "m4v" })
            .option("archive", { type: "boolean" })
            .option("archiveDirectory", { type: "string", default: "veelo-originals" })
            .option("verbose", { type: "boolean" })
            .option("version", { type: "boolean" })
            .option("config", { type: "boolean" })
            .option("embed-srt", { type: "boolean" })
            .option("preserve-dates", { type: "boolean" })
            .option("recurse", { type: "boolean" })
            .option("dry-run", { type: "boolean" })
            .option("output-dir", { type: "string" })
            .option("include", { type: "regex" })
            .option("exclude", { type: "regex" })
            .option("ignoreList", { type: "array", default: [] });
        
    });
    
    it("should instantiate with sensible paths if no supplied config", function(){
        var job = new Job({ inputPath: "test.mov" });
        assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
        assert.strictEqual(job.path.archive, "", JSON.stringify(job));
        assert.strictEqual(job.path.output, "test.m4v", JSON.stringify(job));
        assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });
        
    it("should instantiate default archive path", function(){
        var job = new Job({ 
            config: config.set("archive", true),
            inputPath: "test.mov"
        });
        
        assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
        assert.strictEqual(job.path.archive, path.join(config.get("archiveDirectory"), "test.mov"), JSON.stringify(job));
        assert.strictEqual(job.path.output, "test.m4v", JSON.stringify(job));
        assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate custom archive path", function(){
        config.set("archiveDirectory", "archive")
              .set("archive", true);
        var job = new Job({ 
            config: config,
            inputPath: "test.mov"
        });
        
        assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
        assert.strictEqual(job.path.archive, path.join("archive", "test.mov"), JSON.stringify(job));
        assert.strictEqual(job.path.output, "test.m4v", JSON.stringify(job));
        assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate deep custom archive path", function(){
        config.set("archiveDirectory", path.join("sub", "archive"));
        config.set("archive", true);
        var job = new Job({ inputPath: "test.mov" });
        
        assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
        assert.strictEqual(job.path.archive, path.join("sub", "archive", "test.mov"), JSON.stringify(job));
        assert.strictEqual(job.path.output, "test.m4v", JSON.stringify(job));
        assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate correct nested output-dir", function(){
        config.set("output-dir", "output");
        var job = new Job({ inputPath: "test.mov" });
        
        assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
        assert.strictEqual(job.path.archive, "", JSON.stringify(job));
        assert.strictEqual(job.path.output, path.join("output", "test.m4v"), JSON.stringify(job));
        assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate correct absolute output-dir", function(){
        config.set("output-dir", "../output");
        var job = new Job({ inputPath: "test.mov" });
        
        assert.strictEqual(job.path.input, "test.mov", JSON.stringify(job));
        assert.strictEqual(job.path.archive, "", JSON.stringify(job));
        assert.strictEqual(job.path.output, path.join("..", "output", "test.m4v"), JSON.stringify(job));
        assert.strictEqual(job.path.working, path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should fire 'invalid' event if not a file", function(){
        var job = new Job({ inputPath: path.join(__dirname, "mock/") }),
            message;
            
        job.on("invalid", function(msg){
            message = msg; 
        });
        job.validate();
            
        assert.ok(message, message || "event not fired");
    });

    it("should fire 'invalid' event if file doesn't exist", function(){
        var job = new Job({ inputPath: "kjhlj" }),
            message;
            
        job.on("invalid", function(msg){
            message = msg; 
        });
        job.validate();
            
        assert.ok(message, message || "event not fired");
    });
    
    it("should fire 'processing' on process()", function(){
        var job = new Job({ inputPath: inputPath }),
            eventFired = false;
        
        job.on("processing", function(){
            eventFired = true;
        });
        job.process();
        
        assert.ok(eventFired);
    });
    
    // it("should spawn a process, fire 'processing' event", function(done){
    //     var config = new Config(),
    //         inputFile = path.join(p.FIXTURE_DIR, p.VIDEO1),
    //         processingEmitted,
    //         spawn = sinon.spy(MockHandbrakeCLI.prototype, "spawn");
    // 
    //     var job = new Job(config, inputFile);
    //     job._inject({ HandbrakeCLI: MockHandbrakeCLI });
    //     job.on("processing", function(){
    //         processingEmitted = true;
    //     });
    //     job.on("success", function(){
    //         assert.ok(processingEmitted, "processingEmitted: " + processingEmitted);
    //         assert.ok(spawn.called, spawn);
    //         assert.ok(spawn.args[0][0].i == inputFile, JSON.stringify(spawn.args[0]));
    //         done();
    //     })
    //     job.init();
    //     job.process();
    // });
});
