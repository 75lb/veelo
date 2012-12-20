var assert = require("assert"),
    path = require("path"),
    os = require("os"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    Stream = require("stream"),
    sinon = require("sinon"),
    fs = require("fs-extra"),
    Job = require("../lib/job"),
    Config = require("../lib/config"),
    HandbrakeCLI = require("../lib/handbrakeCli"),
    MockHandbrakeCLI = require("./mock/handbrakeCli");

var VIDEO1 = "clip1.mov", VIDEO1_M4V = "clip1.m4v",
    VIDEO1_MKV = "clip1.mkv", VIDEO1_MP4 = "clip1.mp4",
    VIDEO1_SRT = "clip1.srt",
    VIDEO2 = "music.m4v", VIDEO2_M4V = "music_.m4v",
    VIDEO2_MKV = "music.mkv", VIDEO2_MP4 = "music.mp4",
    MEDIUM = "medium.m4v", MEDIUM_M4V = "medium_.m4v",
    PRESET = "iPod", 
    ASSETS_DIR = path.join(__dirname, "assets"),
    FIXTURE_DIR = path.resolve(__dirname, "fixture"),
    SUB_DIR = path.join(FIXTURE_DIR, "subdir"),
    SUB_DIR2 = path.join(SUB_DIR, "subdir2"),
    ORIGINALS_DIR = "veelo-originals";

function log(msg){
    console.log(util.inspect(msg, true, null, true));
}

function clearFixture(){
    fs.removeSync(FIXTURE_DIR);
    fs.mkdirsSync(SUB_DIR2);
}

function setupSingleFileFixture(file, done){
    clearFixture();
    fs.copy(path.join(ASSETS_DIR, file), path.join(FIXTURE_DIR, file), function(err){
        if (err) throw err;
        done();
    });
}

describe("HandbrakeCLI", function(){
    var handbrakeCLI, mockCp, handle;
    
    function ChildProcess(){
        this.stdin = new ReadableStream();
        this.stdout = new ReadableStream();
        this.stderr = new ReadableStream();
        this.kill = function(){
            this.emit("exit", 0, "SIGTERM");
        }
    }
    ChildProcess.prototype = new EventEmitter();

    function ReadableStream(){
        this.setEncoding = function(){};
    }
    ReadableStream.prototype = new Stream();
    
    beforeEach(function(){
        mockCp = require("./mock/child_process");
        handle = new ChildProcess();
        sinon.stub(mockCp, "spawn").returns(handle);
        handbrakeCLI = new HandbrakeCLI();
        handbrakeCLI._inject({
            cp: mockCp
        });
    });
    
    afterEach(function(){
        mockCp.spawn.restore();
    })
    
    it("should throw with no args", function(){
        assert.throws(function(){
            handbrakeCLI.spawn();
        }, Error);
    });
    
    it("should spawn with correct, passed in args", function(){
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }});
        assert.ok(mockCp.spawn.args[0][1][0] == "-i", mockCp.spawn.args[0][1][0]);
    });
    
    it("should fire 'handbrake-output' on handbrake stdout data", function(){
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }});
        handbrakeCLI.on("handbrake-output", function(data){
            assert.ok(data == "test data", data);
        });
        
        handle.stdout.emit("data", "test data");
    });

    it("should NOT fire 'handbrake-output' on handbrake stderr data", function(){
        var eventFired = false;
        
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }, emitOutput: false });
        handbrakeCLI.on("handbrake-output", function(data){
            assert.ok(data == "test data", data);
            eventFired = true;
        });
        handle.stderr.emit("data", "test data");
        
        assert.ok(eventFired == false);
    });

    it("SHOULD fire 'handbrake-output' on handbrake stderr data + emitOutput", function(){
        var eventFired = false;

        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }, emitOutput: true });
        handbrakeCLI.on("handbrake-output", function(data){
            assert.ok(data == "test data", data);
            eventFired = true;
        });
        handle.stderr.emit("data", "test data");
        
        assert.ok(eventFired == true);
    });
    
    
    it("should fire 'terminated' on killing child_process", function(){
        var eventFired = false;
        
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }});
        handbrakeCLI.on("terminated", function(){
            eventFired = true;
        })
        handle.kill();
        
        assert.ok(eventFired == true);
    });

    it("should fire 'fail' on child_process exit with non-zero code", function(){
        var eventFired = false;
        
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }});
        handbrakeCLI.on("fail", function(){
            eventFired = true;
        })
        handle.emit("exit", 1);
        
        assert.ok(eventFired == true);
    });

    it("should fire 'fail' if Handbrake outputs 'no title found'", function(){
        var eventFired = false;
        
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }});
        handbrakeCLI.on("fail", function(){
            eventFired = true;
        })
        handle.stderr.emit("data", "No title found. Bitch.");
        handle.emit("exit", 0);
        
        assert.ok(eventFired == true);
    });
    
    it("should fire 'success' if Handbrake completes", function(){
        var eventFired = false;
        
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }});
        handbrakeCLI.on("success", function(){
            eventFired = true;
        })
        handle.emit("exit", 0);
        
        assert.ok(eventFired == true);
    });
});


describe("Job", function(){
    before(function(done){
        setupSingleFileFixture(VIDEO1, done);
    });
        
    it("should instantiate with sensible paths if no supplied config", function(){
        var config = new Config();
        var job = new Job(config, "test.mov");
        assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
        assert.ok(job.archivePath == "", JSON.stringify(job));
        assert.ok(job.outputPath == "test.m4v", JSON.stringify(job));
        assert.ok(job.workingPath == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });
        
    it("should instantiate default archive path", function(){
        var config = new Config();
        config.options.veelo.archive = true;
        var job = new Job(config, "test.mov");
        assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
        assert.ok(job.archivePath == path.join("veelo-originals", "test.mov"), JSON.stringify(job));
        assert.ok(job.outputPath == "test.m4v", JSON.stringify(job));
        assert.ok(job.workingPath == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate custom archive path", function(){
        var config = new Config();
        config.options.veelo.archiveDirectory = "archive";
        config.options.veelo.archive = true;

        var job = new Job(config, "test.mov");
        assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
        assert.ok(job.archivePath == path.join("archive", "test.mov"), JSON.stringify(job));
        assert.ok(job.outputPath == "test.m4v", JSON.stringify(job));
        assert.ok(job.workingPath == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate deep custom archive path", function(){
        var config = new Config();
        config.options.veelo.archiveDirectory = path.join("sub", "archive");
        config.options.veelo.archive = true;

        var job = new Job(config, "test.mov");
        assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
        assert.ok(job.archivePath == path.join("sub", "archive", "test.mov"), JSON.stringify(job));
        assert.ok(job.outputPath == "test.m4v", JSON.stringify(job));
        assert.ok(job.workingPath == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate correct nested output-dir", function(){
        var config = new Config();
        config.options.veelo["output-dir"] = "output";
        var job = new Job(config, "test.mov");
        assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
        assert.ok(job.archivePath == "", JSON.stringify(job));
        assert.ok(job.outputPath == path.join("output", "test.m4v"), JSON.stringify(job));
        assert.ok(job.workingPath == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should instantiate correct absolute output-dir", function(){
        var config = new Config();
        config.options.veelo["output-dir"] = "../output";

        var job = new Job(config, "test.mov");
        assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
        assert.ok(job.archivePath == "", JSON.stringify(job));
        assert.ok(job.outputPath == path.join("..", "output", "test.m4v"), JSON.stringify(job));
        assert.ok(job.workingPath == path.join(os.tmpDir(), ".processing.test.m4v"), JSON.stringify(job));
    });

    it("should fire 'invalid' event if not a file", function(){
        var config = new Config();
        var job = new Job(config, path.join(__dirname, "mock/")), 
            message;
            
        job.on("invalid", function(msg){
            message = msg; 
        });
        job.init();
            
        assert.ok(message, message || "event not fired");
    });

    it("should fire 'invalid' event if file doesn't exist", function(){
        var config = new Config();
        var job = new Job(config, "kjhkjhjkgb"), message;
            
        job.on("invalid", function(msg){
            message = msg; 
        });
        job.init();
            
        assert.ok(message, message || "event not fired");
    });
                
    // it("should spawn a process, fire 'processing' event", function(done){
    //     var config = new Config(),
    //         inputFile = path.join(FIXTURE_DIR, VIDEO1),
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
