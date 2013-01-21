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
    
    it("should correctly add and register test file as valid", function(){
        veelo.add(_inputFile);
        
        assert.strictEqual(veelo.queue.stats.valid, 1, JSON.stringify(veelo));
    });

    describe("events: ", function(){
        it("should fire 'queue-starting' event", function(){
            var startingEventFired = false;

            veelo.add(_inputFile);
            veelo.on("queue-starting", function(){
                startingEventFired = true;
            });
            veelo.start();
    
            assert.strictEqual(startingEventFired, true);
        });

        it("should fire 'job-starting' event");
        it("should fire 'job-progress' event, return correct progress data", function(){
            var progressData;

            veelo.add(_inputFile);
            veelo.on("job-progress", function(progress){
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

        it("start should fire 'error' event");
        it("start should fire 'warning' event");
        it("start should fire 'info' event");

        it("start should fire 'queue-complete' event");    
    });
});

