var shared = require("./shared"), p = shared.path,
    EventEmitter = require("events").EventEmitter,
    path = require("path"),
    assert = require("assert"),
    veelo = require("../lib/veelo");

var inputFile = path.join(p.FIXTURE_DIR, p.VIDEO1);

before(function(done){
    shared.setupSingleFileFixture(p.VIDEO1, done);
});

beforeEach(function(){
    veelo.clear();
})
    
it("should correctly add and register test file as valid", function(){
    veelo.add(inputFile);
        
    assert.strictEqual(veelo.queue.stats.valid, 1, JSON.stringify(veelo));
});

it("should start() and raise 'starting', 'progress' and 'complete' events", function(){
    var startingEventFired = false;
    var mockQueue = function(){};
    mockQueue.prototype = new EventEmitter();
    mockQueue.prototype.process = function(){
        this.emit("starting");
    };

    veelo._inject(mockQueue);
    veelo.add(inputFile);
    veelo.on("starting", function(){
        startingEventFired = true;
    });
    veelo.start();
    
    assert.strictEqual(startingEventFired, true);
});

it("start should raise 'error' event");
it("start should raise 'warning' event");
it("start should raise 'info' event");
it("start should raise 'starting' event");
it("start should raise 'complete' event");
it("start should raise 'progress' event");