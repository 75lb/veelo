var assert = require("assert"),
	fs = require("fs-extra"),
	path = require("path"),
	util = require("util"),
	exec = require("child_process").exec,
	Job = require("../lib/job"),
	HandbrakeCLI = require("../lib/handbrakeCli"),
	Config = require("./mock/config");

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
	ORIGINALS_DIR = "handbraker-originals",
	PRESET_DIR = "handbraker - iPod";

function run(){
	var args = Array.prototype.slice.call(arguments),
		done = args.pop(),
		formatArgs = args,
		cmd = "node cli.js " + util.format.apply(this, formatArgs);
	// l(cmd);
	exec(cmd, function(err, stdout, stderr){
		if (err) {
			// l("failed to run: " + cmd);
			throw err;
		}
		done(stdout + stderr);
	});
}

function exists(file){
	return fs.existsSync(file);
}

function clearFixture(){
	fs.removeSync(FIXTURE_DIR);
	fs.mkdirsSync(SUB_DIR2);
}

function setupSingleFileFixture(file, done){
	clearFixture();
	fs.copy(path.join(ASSETS_DIR, file), path.join(FIXTURE_DIR, file), function(err){
		if (err) throw err;
		fs.copy(path.join(ASSETS_DIR, file), path.join(SUB_DIR, file), function(err){
			if (err) throw err;
			done();
		});
	});
}

function setupSingleFileAndSrt(done){
	clearFixture();
	fs.copy(path.join(ASSETS_DIR, VIDEO1), path.join(FIXTURE_DIR, VIDEO1), function(err){
		if (err) throw err;
		fs.copy(path.join(ASSETS_DIR, VIDEO1_SRT), path.join(FIXTURE_DIR, VIDEO1_SRT), function(err){
			if (err) throw err;
			done();
		});
	});
}

function setupMultipleFileFixture(done){
	clearFixture();
	fs.copy(path.join(ASSETS_DIR, VIDEO1), path.join(FIXTURE_DIR, VIDEO1), function(err){
		fs.copy(path.join(ASSETS_DIR, VIDEO1), path.join(SUB_DIR, VIDEO1), function(err){
			fs.copy(path.join(ASSETS_DIR, VIDEO2), path.join(FIXTURE_DIR, VIDEO2), function(err){
				fs.copy(path.join(ASSETS_DIR, VIDEO2), path.join(SUB_DIR, VIDEO2), function(err){
					done();
				});
			});
		});
	});
}

function setupDeepFileFixture(done){
	clearFixture();
	fs.copy(path.join(ASSETS_DIR, VIDEO1), path.join(FIXTURE_DIR, VIDEO1), function(err){
		fs.copy(path.join(ASSETS_DIR, VIDEO2), path.join(SUB_DIR, VIDEO2), function(err){
			fs.copy(path.join(ASSETS_DIR, MEDIUM), path.join(SUB_DIR2, MEDIUM), function(err){
				done();
			});
		});
	});
}

function l(msg){
	console.log(msg);
}

describe.only("Unit Test", function(){
	
	describe("Job", function(){
		var config = new Config();
		
		it("should instantiate with sensible paths if no supplied config", function(){
			var job = new Job(config, "test.mov");
			assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
			assert.ok(job.archivePath == "", JSON.stringify(job));
			assert.ok(job.outputPath == "test.m4v", JSON.stringify(job));
			assert.ok(job.workingPath == ".processing.test.m4v", JSON.stringify(job));
		});
		
		it("should instantiate default archive path", function(){
			config = {
				options: {
					handbraker: {
						archive: true
					}
				}
			};
			var job = new Job(config, "test.mov");
			assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
			assert.ok(job.archivePath == path.join("handbraker-originals", "test.mov"), JSON.stringify(job));
			assert.ok(job.outputPath == "test.m4v", JSON.stringify(job));
			assert.ok(job.workingPath == ".processing.test.m4v", JSON.stringify(job));
		});

		it("should instantiate custom archive path", function(){
			config = {
				archiveDirectory: "archive",
				options: {
					handbraker: {
						archive: true
					}
				}
			};
			var job = new Job(config, "test.mov");
			assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
			assert.ok(job.archivePath == path.join("archive", "test.mov"), JSON.stringify(job));
			assert.ok(job.outputPath == "test.m4v", JSON.stringify(job));
			assert.ok(job.workingPath == ".processing.test.m4v", JSON.stringify(job));
		});

		it("should instantiate deep custom archive path", function(){
			config = {
				archiveDirectory: path.join("sub", "archive"),
				options: {
					handbraker: {
						archive: true
					}
				}
			};
			var job = new Job(config, "test.mov");
			assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
			assert.ok(job.archivePath == path.join("sub", "archive", "test.mov"), JSON.stringify(job));
			assert.ok(job.outputPath == "test.m4v", JSON.stringify(job));
			assert.ok(job.workingPath == ".processing.test.m4v", JSON.stringify(job));
		});

		it("should instantiate correct nested output-dir", function(){
			config = {
				options: {
					handbraker: {
						"output-dir": "output"
					}
				}
			};
			var job = new Job(config, "test.mov");
			assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
			assert.ok(job.archivePath == "", JSON.stringify(job));
			assert.ok(job.outputPath == path.join("output", "test.m4v"), JSON.stringify(job));
			assert.ok(job.workingPath == ".processing.test.m4v", JSON.stringify(job));
		});

		it("should instantiate correct absolute output-dir", function(){
			config = {
				options: {
					handbraker: {
						"output-dir": "../output"
					}
				}
			};
			var job = new Job(config, "test.mov");
			assert.ok(job.inputPath == "test.mov", JSON.stringify(job));
			assert.ok(job.archivePath == "", JSON.stringify(job));
			assert.ok(job.outputPath == path.join("..", "output", "test.m4v"), JSON.stringify(job));
			assert.ok(job.workingPath == ".processing.test.m4v", JSON.stringify(job));
		});

		it("should fire 'invalid' event if not a file", function(){
			var job = new Job(config, path.join(__dirname, "mock/")), 
				message;
			
			job.on("invalid", function(msg){
				message = msg; 
			});
			job.init();
			
			assert.ok(message, message || "event not fired");
		});

		it("should fire 'invalid' event if file doesn't exist", function(){
			var job = new Job(config, "kjhkjhjkgb"), message;
			
			job.on("invalid", function(msg){
				message = msg; 
			});
			job.init();
			
			assert.ok(message, message || "event not fired");
		});
				
		// it("should spawn a process, fire 'processing' event", function(done){
		// 	// needs DI solution
		// });
		
	});
	
	describe("HandbrakeCLI", function(){
		it("should spawn HandbrakeCLI with no args", function(done){
			var handbrakeCLI = new HandbrakeCLI();
			handbrakeCLI.spawn();
		});
	});
});

describe("Integration Test", function(){
	describe("operations which don't encode files", function(){
		it("should print help when called without options", function(done){
			run("", function(output){
				assert.ok(output.match(/Usage:/));
				done();
			});
		});

		it("should print Handbrake help output with --hbhelp", function(done){
			run("--hbhelp", function(output){
				assert.ok(output.match(/General Handbrake Options/));
				done();
			});
		});
	});

	describe("HandbrakeCLI operations", function(){
		before(function(done){
			setupSingleFileFixture(MEDIUM, done);
		});
	
		it("should scan title information", function(done){
			run('-t 0 "%s"', path.join(FIXTURE_DIR, MEDIUM), function(output){
				assert.ok(output.match(/hb_init: starting libhb/));
				done();
			})
		});
	
		it("should print preset-list", function(done){
			run("--preset-list", function(output){
				assert.ok(output.match(/< Devices/));
				done();
			});
		});
	
		it("should set --preset", function(done){
			run('--verbose --preset %s "%s"', PRESET, path.join(FIXTURE_DIR, MEDIUM), function(output){
				assert.ok(output.match(/Using preset: iPod/));
				assert.ok(output.match(/New dimensions 320/));
				done();
			})
		});
	});

	describe("basic operation on a single file", function(){
		before(function(done){
			setupSingleFileFixture(VIDEO1, done);
		});
	
		it("should encode a single MP4", function(done){
			var inputPath = path.join(FIXTURE_DIR, VIDEO1),
				outputPath = path.join(FIXTURE_DIR, VIDEO1_MP4);
		
			run('--ext mp4 "%s"', inputPath, function(output){
				assert.ok(fs.existsSync(outputPath), "outputPath doesn't exist: " + outputPath);
				run('-t 0 "%s"', outputPath, function(output){
					assert.ok(output.match(/Input #0, mov,mp4/), "output is not an MP4");
					done();
				});
			});
		});
	
		it("should encode a single MKV", function(done){
			run('--ext mkv "%s"', path.join(FIXTURE_DIR, VIDEO1), function(output){
				assert.ok(fs.existsSync(path.join(FIXTURE_DIR, VIDEO1_MKV)));
				run('-t 0 "%s"', path.join(FIXTURE_DIR, VIDEO1_MKV), function(output){
					assert.ok(output.match(/Input #0, matroska,webm/));
					done();
				});			
			});
		});

		it("should encode a single M4V", function(done){
			run('--ext m4v "%s"', path.join(FIXTURE_DIR, VIDEO1), function(output){
				assert.ok(fs.existsSync(path.join(FIXTURE_DIR, VIDEO1_M4V)));
				run('-t 0 "%s"', path.join(FIXTURE_DIR, VIDEO1_M4V), function(output){
					assert.ok(output.match(/Input #0, mov,mp4/));
					done();
				});			
			});
		});
	
		it("should encode a single file in a sub-directory", function(done){
			run('--ext mp4 "%s"', path.join(SUB_DIR, VIDEO1), function(output){
				assert.ok(fs.existsSync(path.join(SUB_DIR, VIDEO1_MP4)));
				run('-t 0 "%s"', path.join(SUB_DIR, VIDEO1_MP4), function(output){
					assert.ok(output.match(/Input #0, mov,mp4/));
					done();
				});			
			});
		})
	
	});

	describe("basic operations on multiple files", function(){
		before(function(done){
			setupMultipleFileFixture(done);
		});
	
		it("should process multiple files", function(done){
			run('"%s" "%s"', path.join(FIXTURE_DIR, VIDEO1), path.join(FIXTURE_DIR, VIDEO2), function(output){
				assert.ok(exists(path.join(FIXTURE_DIR, VIDEO1_M4V)));
				assert.ok(exists(path.join(FIXTURE_DIR, VIDEO2_M4V)));
				done();
			});
		});
	});

	describe("archive operations", function(){
		before(function(done){
			setupSingleFileFixture(VIDEO1, done);
		});
	
		it("should archive input file", function(done){
			run('--archive "%s"', path.join(FIXTURE_DIR, VIDEO1), function(output){
				assert.ok(exists(path.join(FIXTURE_DIR, VIDEO1_M4V)));
				assert.ok(exists(path.join(FIXTURE_DIR, ORIGINALS_DIR, VIDEO1)));
				done();
			});
		});
	
		it("should archive input file in a sub-directory", function(done){
			run('--archive "%s"', path.join(SUB_DIR, VIDEO1), function(output){
				assert.ok(exists(path.join(SUB_DIR, VIDEO1_M4V)));
				assert.ok(exists(path.join(SUB_DIR, ORIGINALS_DIR, VIDEO1)));
				done();
			});
		});
	});

	describe("output-dir operations", function(){
		before(function(done){
			setupSingleFileFixture(VIDEO1, done);
		});
	
		it("should output to sub-directory alongside input file", function(done){
			run('--output-dir test "%s"', path.join(FIXTURE_DIR, VIDEO1), function(output){
				assert.ok(exists(path.join(FIXTURE_DIR, VIDEO1)));
				assert.ok(exists(path.join(FIXTURE_DIR, "test", VIDEO1_M4V)));
				done();
			});
		});
	
		it("should output to specific sub-directory", function(done){
			run('--output-dir "%s" "%s"', "./test/fixture/test2", path.join("test/fixture", VIDEO1), function(output){
				assert.ok(exists(path.join(FIXTURE_DIR, VIDEO1)));
				assert.ok(exists(path.join("test/fixture/test2/test/fixture", VIDEO1_M4V)));
				done();
			});
		});
	});

	describe("preserve-dates", function(){
		var inputFile = path.join(FIXTURE_DIR, VIDEO1),
			outputFile = path.join(FIXTURE_DIR, VIDEO1_M4V);
	
		before(function(done){
			setupSingleFileFixture(VIDEO1, done);
		});
	
		it("should preserve modified and accessed times on output", function(done){
			run('--preserve-dates "%s"', inputFile, function(){
				var inputFileStat = fs.statSync(inputFile),
					outputFileStat = fs.statSync(outputFile);
				assert.ok(inputFileStat.mtime.getTime() === outputFileStat.mtime.getTime());
				assert.ok(inputFileStat.atime.getTime() === outputFileStat.atime.getTime());
				done();
			});
		});
	});

	describe("invalid input", function(){
		var uselessFile = path.join(FIXTURE_DIR, "uselessfile"),
			uselessDir = path.join(FIXTURE_DIR, "uselessDir"),
			ignoredFile = path.join(FIXTURE_DIR, ".DS_Store"),
			inputFile = path.join(FIXTURE_DIR, VIDEO1);
	
		before(function(){
			setupSingleFileFixture(VIDEO1, function(){
				fs.writeFileSync(uselessFile, "");
				fs.writeFileSync(ignoredFile, "");
				fs.mkdirSync(uselessDir);
			});
		});

		it("should fail to encode a none-existent file", function(done){
			run("klsdjhflkdhf", function(output){
				assert.ok(output.match(/failed/));
				done();
			});
		});
	
		it("should throw trying to encode a useless file", function(done){
			run('"%s"', uselessFile, function(output){
				assert.ok(output.match(/failed/));
				done();
			});
		});

		it("should throw trying to encode a directory", function(done){
			run('"%s"', uselessDir, function(output){
				assert.ok(output.match(/failed/));
				done();
			});
		});

		it("should throw on invalid --audio selection", function(done){
			run('"%s" --audio 10', inputFile, function(output){
				assert.ok(output.match(/Invalid audio input track/));
				done();
			});
		});

		it("should obey ignore list", function(done){
			run('"%s"', ignoredFile, function(output){
				assert.ok(output == "", "output length should be 0, is: " + output.length);
				done();
			});
		});
	
		it("should throw on invalid include regex", function(done){
			run('--recurse --include +.mov "%s"', path.join(FIXTURE_DIR), function(output){
				assert.ok(output.match(/Invalid regular expression/), "unexpected output: " + output);
				done();
			});
		});

		it("should throw on invalid exclude regex", function(done){
			run('--recurse --exclude +.mov "%s"', path.join(FIXTURE_DIR), function(output){
				assert.ok(output.match(/Invalid regular expression/), "unexpected output: " + output);
				done();
			});
		});
	
		it("should fail on invalid recurse path", function(done){
			run("--recurse sldfjdslf", function(output){
				assert.ok(output.match(/file does not exist/i), output);
				done();
			});
		});
	});

	describe("recurse", function(){
		beforeEach(function(done){
			setupDeepFileFixture(done);
		});
	
		it("should process whole tree", function(done){
			run('--recurse "%s"', FIXTURE_DIR, function(output){
				assert.ok(exists(path.join(FIXTURE_DIR, VIDEO1_M4V)));
				assert.ok(exists(path.join(SUB_DIR, VIDEO2_M4V)));
				assert.ok(exists(path.join(SUB_DIR2, MEDIUM_M4V)));
				done();
			});
		});

		it("should include .mov files", function(done){
			run('--recurse --include \\.mov "%s"', FIXTURE_DIR, function(output){
				assert.ok(exists(path.join(FIXTURE_DIR, VIDEO1_M4V)));
				assert.ok(!exists(path.join(SUB_DIR, VIDEO2_M4V)));
				assert.ok(!exists(path.join(SUB_DIR2, MEDIUM_M4V)));
				done();
			});
		});

		it("should exclude .m4v files", function(done){
			run('--recurse --exclude \\.m4v "%s"', FIXTURE_DIR, function(output){
				assert.ok(exists(path.join(FIXTURE_DIR, VIDEO1_M4V)));
				assert.ok(!exists(path.join(SUB_DIR, VIDEO2_M4V)));
				assert.ok(!exists(path.join(SUB_DIR2, MEDIUM_M4V)));
				done();
			});
		});
	});

	describe("embed-srt", function(){
		before(function(done){
			setupSingleFileAndSrt(done);
		});
	
		it("should embed external srt subtitles in mp4 output", function(done){
			run('--embed-srt "%s"', path.join(FIXTURE_DIR, VIDEO1), function(){
				run("-t 0 %s", path.join(FIXTURE_DIR, VIDEO1_M4V), function(output){
					assert.ok(output.indexOf("+ 1, English (iso639-2: eng)") > 0);
					done();
				});
			});
		});

		it("should embed external srt subtitles in mkv output", function(done){
			run('--embed-srt --ext mkv "%s"', path.join(FIXTURE_DIR, VIDEO1), function(){
				run('-t 0 "%s"', path.join(FIXTURE_DIR, VIDEO1_MKV), function(output){
					assert.ok(output.indexOf("+ 1, English (iso639-2: eng)") > 0);
					done();
				});
			});
		});
	});

	describe("config file", function(){
		var configPath = process.platform == "win32"
			? path.join(process.env.APPDATA, ".handbraker")
			: path.join(process.env.HOME, ".handbraker");
	
		it("should be created in the correct place", function(done){
			run("", function(output){
				assert.ok(fs.existsSync(configPath));
				done();
			});
		});
	});
});

// test config default options
// test invalid config file - offer to fix
// test incorrect options like --exlude
// test output-dir on different drive
// test `--recurse * --exclude` on *nix.. ensure all non-directories passed in are filtered
// test for 'numeric directory' bug regression
// test using mock config 
// test correct cleanup on CTRL+C

// feature: pass multiple presets to output multiple versions
// file globbing on windows
// user-defined presets
// add presets for Blackberry
// preset repo server
// tidy up HandBrakeCLI command output, once completed
// --info option
// add option to analyse each input file on --dry-run (run --info on each file too)
// completed hook, notification, alert, email etc.
// --defaults option, list defaults
// --scan should default to verbose
// make config.options show only passed-in options.. everything in defaultOptions.
// config: set a default config if configFile doesn't exist
// config: move h, help, hbhelp to defaultOptions
// move FlattenArgsHash to HandbrakeCLI

// note: preserve-dates acts differently on SMB and AFP
// move console writing out of Job?
// improve colouring, test on different terminal colour schemes
// remove identical options between Handbraker and Handbrake help, e.g. -v -h
// print "additional Handbrake options" on dry-run, e.g. Also: start-at 60 etc
// add option to set your own HandbrakeCLI bin path
// move arg processing and Handbrake work from handbrake.js to job.js
