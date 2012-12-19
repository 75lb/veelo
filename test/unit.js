var assert = require("assert"),
    sinon = require("sinon"),
    fs = require("fs-extra"),
	path = require("path"),
    os = require("os"),
	util = require("util"),
    EventEmitter = require("events").EventEmitter,
	Job = require("../lib/job"),
    Config = require("../lib/config"),
	MockHandbrakeCLI = require("./mock/handbrakeCli");

var	VIDEO1 = "clip1.mov", VIDEO1_M4V = "clip1.m4v",
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


describe("Job", function(){
    // var _config = {
    //     defaults: {},
    //         passedIn: {},
    //         options: {
    //             veelo: {
    //                 ext: "m4v",
    //                 ignoreList: [],
    //                 archiveDirectory: "veelo-originals"
    //             },
    //             handbrake: {},
    //             files: []
    //         }
    // };
		
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
				
    it("should spawn a process, fire 'processing' event", function(done){
		var config = new Config(),
            inputFile = path.join(FIXTURE_DIR, VIDEO1),
            processingEmitted,
            job = new Job(config, inputFile),
            spy = sinon.spy(MockHandbrakeCLI.prototype, "spawn");
            
        job._inject({ HandbrakeCLI: MockHandbrakeCLI });
        
        job.on("processing", function(){
            processingEmitted = true;
        });
        job.on("success", function(){
            assert.ok(processingEmitted, "processingEmitted: " + processingEmitted);
            assert.ok(spy.called, spy);
            assert.ok(spy.args[0][0].i == inputFile, JSON.stringify(spy.args[0]));
            done();
        })
        job.init();
        job.process();
    });
		
});

describe("HandbrakeCLI", function(){
    it("should spawn HandbrakeCLI with no args", function(done){
        var handbrakeCLI = new HandbrakeCLI();
        handbrakeCLI.spawn();
    });
});