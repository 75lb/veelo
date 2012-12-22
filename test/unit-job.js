var assert = require("assert"),
    path = require("path"),
    os = require("os"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    sinon = require("sinon"),
    fs = require("fs-extra"),
    Job = require("../lib/job"),
    Config = require("../lib/config"),
    HandbrakeCLI = require("../lib/handbrakeCli"),
    Veelo = require("../lib/veelo"),
    shared = require("./shared");

describe("Job", function(){
    var config,
        p = shared.path,
        inputPath = path.join(p.FIXTURE_DIR, p.VIDEO1);
    
    before(function(done){
        shared.setupSingleFileFixture(p.VIDEO1, done);
    });
    beforeEach(function(){
        config = new Config({
            configDefinition: Veelo.configDefinition
        });
    });
    
    it("should instantiate with sensible paths if no supplied config", function(){
        var job = new Job({ inputPath: "test.mov" });
        assert.ok(job.path.input == "test.mov", JSON.stringify(job));
        assert.ok(job.path.archive == "", JSON.stringify(job));
        assert.ok(job.path.output == "test.m4v", JSON.stringify(job));
        assert.ok(job.path.working == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });
        
    it("should instantiate default archive path", function(){
        var job = new Job({ 
            config: config.set("archive", true),
            inputPath: "test.mov"
        });
        
        assert.ok(job.path.input == "test.mov", JSON.stringify(job));
        assert.ok(job.path.archive == path.join(config.get("archiveDirectory"), "test.mov"), JSON.stringify(job));
        assert.ok(job.path.output == "test.m4v", JSON.stringify(job));
        assert.ok(job.path.working == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate custom archive path", function(){
        config.set("archiveDirectory", "archive")
              .set("archive", true);
        var job = new Job({ 
            config: config,
            inputPath: "test.mov"
        });
        
        assert.ok(job.path.input == "test.mov", JSON.stringify(job));
        assert.ok(job.path.archive == path.join("archive", "test.mov"), JSON.stringify(job));
        assert.ok(job.path.output == "test.m4v", JSON.stringify(job));
        assert.ok(job.path.working == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate deep custom archive path", function(){
        config.options.veelo.archiveDirectory = path.join("sub", "archive");
        config.options.veelo.archive = true;
        var job = new Job({ 
            config: config,
            inputPath: "test.mov"
        });
        
        assert.ok(job.path.input == "test.mov", JSON.stringify(job));
        assert.ok(job.path.archive == path.join("sub", "archive", "test.mov"), JSON.stringify(job));
        assert.ok(job.path.output == "test.m4v", JSON.stringify(job));
        assert.ok(job.path.working == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate correct nested output-dir", function(){
        config.options.veelo["output-dir"] = "output";
        var job = new Job({ 
            config: config,
            inputPath: "test.mov"
        });
        
        assert.ok(job.path.input == "test.mov", JSON.stringify(job));
        assert.ok(job.path.archive == "", JSON.stringify(job));
        assert.ok(job.path.output == path.join("output", "test.m4v"), JSON.stringify(job));
        assert.ok(job.path.working == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate correct absolute output-dir", function(){
        config.options.veelo["output-dir"] = "../output";

        var job = new Job(config, "test.mov");
        assert.ok(job.path.input == "test.mov", JSON.stringify(job));
        assert.ok(job.path.archive == "", JSON.stringify(job));
        assert.ok(job.path.output == path.join("..", "output", "test.m4v"), JSON.stringify(job));
        assert.ok(job.path.working == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should fire 'invalid' event if not a file", function(){
        var job = new Job(config, path.join(__dirname, "mock/")), 
            message;
            
        job.on("invalid", function(msg){
            message = msg; 
        });
        job.validate();
            
        assert.ok(message, message || "event not fired");
    });

    it("should fire 'invalid' event if file doesn't exist", function(){
        var job = new Job(config, "kjhkjhjkgb"), message;
            
        job.on("invalid", function(msg){
            message = msg; 
        });
        job.validate();
            
        assert.ok(message, message || "event not fired");
    });
    
    it("should fire 'processing' on process()", function(){
        var eventFired = false,
            job = new Job(config, inputPath);
        
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
