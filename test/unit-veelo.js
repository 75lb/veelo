var shared = require("./shared"), p = shared.path,
    EventEmitter = require("events").EventEmitter,
    path = require("path"),
    assert = require("assert"),
    veelo = require("../lib/veelo");

var _inputFile = path.join(p.FIXTURE_DIR, p.VIDEO1);

// mocks
var MockJob = function(settings){
    var testOutput = "Encoding: task 1 of 1, 0.59 % (127.14 fps, avg 134.42 fps, ETA 00h13m19s)";
    this.process = function(){};
    this.setInput = function(){};
    this.validate = function(){
        this.emit(MockJob.valid ? "valid" : "invalid");
    };
    this.is = {};
    this.path = {};
    this.throw = function(event){
        this.emit(event);
    }
};
MockJob.prototype = new EventEmitter();
MockJob.valid = true;
veelo._inject(MockJob);

describe("Veelo", function(){
    before(function(done){
        shared.setupSingleFileFixture(p.VIDEO1, done);
    });

    beforeEach(function(){
        veelo.clear();
    })
    
    describe("properties: ", function(){
        it("should expose a Config instance", function(){
            assert.strictEqual(veelo.config, require("../lib/config"));
        });
    });
    
    describe("methods: ", function(){
        it("should correctly add() and register valid file", function(){
            MockJob.valid = true;
            veelo.add("some file");
        
            assert.strictEqual(veelo.stats.jobs.valid, 1, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.valid.length, 1, JSON.stringify(veelo.jobs));
        });
        
        it("should correctly add() and register invalid file", function(){
            MockJob.valid = false;
            veelo.add("kjhkjlh");
        
            assert.strictEqual(veelo.stats.jobs.invalid, 1, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.invalid.length, 1, JSON.stringify(veelo.jobs));
        });
        
        it("should complained if file already added");

        it("should clear()", function(){
            MockJob.valid = true;
            veelo.add("validfile");        
            assert.strictEqual(veelo.stats.jobs.valid, 1, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.valid.length, 1, JSON.stringify(veelo.jobs));
            MockJob.valid = false;
            veelo.add("invalidfile");
            assert.strictEqual(veelo.stats.jobs.invalid, 1, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.invalid.length, 1, JSON.stringify(veelo.jobs));
            
            veelo.clear();
            assert.strictEqual(veelo.stats.jobs.invalid, 0, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.invalid.length, 0, JSON.stringify(veelo.jobs));
            assert.strictEqual(veelo.stats.jobs.valid, 0, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.valid.length, 0, JSON.stringify(veelo.jobs));
        });
        
        it("should start(), executing a command based on options specified");
    })

    describe("events:", function(){
        describe("with valid input file supplied", function(){
            it("start() should fire 'starting' event, passing queue stats", function(){
                var startingEventFired = false,
                    startingStats;

                MockJob.valid = true;
                veelo.add(_inputFile);
                veelo.on("starting", function(stats){
                    startingEventFired = true;
                    startingStats = stats;
                });
                veelo.start();

                assert.strictEqual(startingEventFired, true, JSON.stringify(startingStats));
                assert.strictEqual(startingStats.jobs.valid, 1, JSON.stringify(startingStats));
                assert.ok(
                    Date.now() - startingStats.time.start < 50, 
                    "now: " + Date.now() + ", start time: " + startingStats.time.start
                );
                assert.deepEqual(startingStats.jobs.fileExtensions, {
                    ".mov": 1
                }, JSON.stringify(startingStats));
            });

            it("should fire 'job-starting' event");
            it("should fire 'progress' event, return correct progress data", function(){
                
                // need to add mock Job to the queue
                
                var progressData;

                veelo.add(_inputFile);
                veelo.on("progress", function(progress){
                    progressData = progress;
                });
                veelo.on("starting", function(stats){
                    // console.log("STARTING");
                    // shared.log(veelo.jobs);
                })
                veelo.start();
    
                assert.deepEqual(progressData, {
                   percentComplete: 0.59,
                   fps: 127.14,
                   avgFps: 134.42,
                   eta: "00h13m19s"
                }, JSON.stringify(veelo.jobs) + "\n" + JSON.stringify(veelo.stats));
            });
            it("should fire 'job-complete' event");
            it("should fire 'complete' event");
        });

        it("start should fire 'error' event");
        it("start should fire 'warning' event");
        it("start should fire 'info' event");

    });
});

