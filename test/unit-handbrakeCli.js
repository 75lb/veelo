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
    handbrakeCLI = require("../lib/handbrakeCli")
    Veelo = require("../lib/veelo");

describe("handbrakeCLI", function(){
    var mockCp, handle;
    
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
        mockCp = { 
            spawn: function(){} 
        };
        handle = new ChildProcess();
        sinon.stub(mockCp, "spawn").returns(handle);
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
    
    it("should fire 'output' on handbrake stdout data", function(){
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }});
        handbrakeCLI.on("output", function(data){
            assert.ok(data == "test data", data);
        });
        
        handle.stdout.emit("data", "test data");
    });

    it("should NOT fire 'output' on handbrake stderr data", function(){
        var eventFired = false;
        
        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }, emitOutput: false });
        handbrakeCLI.on("output", function(data){
            assert.ok(data == "test data", data);
            eventFired = true;
        });
        handle.stderr.emit("data", "test data");
        
        assert.ok(eventFired == false);
    });

    it("SHOULD fire 'output' on handbrake stderr data + emitOutput", function(){
        var eventFired = false;

        handbrakeCLI.spawn({ handbrakeArgs: { i: "test.mov", o: "test.m4v" }, emitOutput: true });
        handbrakeCLI.on("output", function(data){
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
    
    it("should just have a 'run' method, not 'spawn' and 'exec'");
});