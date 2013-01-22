var shared = require("./shared"), p = shared.path,
    EventEmitter = require("events").EventEmitter,
    path = require("path"),
    assert = require("assert"),
    veelo = require("../lib/veelo");

var _inputFile = path.join(p.FIXTURE_DIR, p.VIDEO1);

// mocks
var _mockQueue = function(){
    this.stats = {
        valid: 0
    };
};
_mockQueue.prototype = new EventEmitter();
_mockQueue.prototype.process = function(){
    this.emit("begin");
    this.emit(
        "handbrake-output", 
        "Encoding: task 1 of 1, 0.59 % (127.14 fps, avg 134.42 fps, ETA 00h13m19s)"
    );
};
_mockQueue.prototype.add = function(){
    this.stats.valid += 1;
};

veelo._inject(_mockQueue);

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
            veelo.add(_inputFile);
        
            assert.strictEqual(veelo.stats.valid, 1, JSON.stringify(veelo));
            assert.strictEqual(veelo.jobs.valid.length, 1, JSON.stringify(veelo));
        });
        
        it("should correctly add() and register invalid file", function(){
            veelo.add("kjhkjlh");
        
            assert.strictEqual(veelo.stats.invalid, 1, JSON.stringify(veelo));
            assert.strictEqual(veelo.jobs.invalid.length, 1, JSON.stringify(veelo));
        });
        
        it("should complained if file already added");

        it("should clear()", function(){
            veelo.add(_inputFile);        
            assert.strictEqual(veelo.stats.valid, 1, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.valid.length, 1, JSON.stringify(veelo.jobs));
            veelo.add("kjhkjlh");
            assert.strictEqual(veelo.stats.invalid, 1, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.invalid.length, 1, JSON.stringify(veelo.jobs));
            
            veelo.clear();
            assert.strictEqual(veelo.stats.invalid, 0, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.invalid.length, 0, JSON.stringify(veelo.jobs));
            assert.strictEqual(veelo.stats.valid, 0, JSON.stringify(veelo.stats));
            assert.strictEqual(veelo.jobs.valid.length, 0, JSON.stringify(veelo.jobs));
        });
        
        it("should start(), executing a command based on options specified");
    })

    describe("events:", function(){
        describe("with valid input file supplied", function(){
            it("should fire 'starting' event with queue stats", function(){
                var startingEventFired = false,
                    startingStats;

                veelo.add(_inputFile);
                veelo.on("starting", function(stats){
                    startingEventFired = true;
                    startingStats = stats;
                });
                veelo.start();
    
                assert.strictEqual(startingEventFired, true);
                assert.strictEqual(startingStats.jobs.valid, 1);
                assert.deepEqual(startingStats.jobs.fileExtensions, {
                    ".mov": 1
                });
            });

            it("should fire 'job-starting' event");
            it("should fire 'progress' event, return correct progress data", function(){
                var progressData;

                veelo.add(_inputFile);
                veelo.on("progress", function(progress){
                    progressData = progress;
                });
                veelo.start();
    
                assert.deepEqual(progressData, {
                   percentComplete: 0.59,
                   fps: 127.14,
                   avgFps: 134.42,
                   eta: "00h13m19s"
                });
            });
            it("should fire 'job-complete' event");
            it("should fire 'complete' event");
        });

        it("start should fire 'error' event");
        it("start should fire 'warning' event");
        it("start should fire 'info' event");

    });
});

