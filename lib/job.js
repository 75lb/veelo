var EventEmitter = require("events").EventEmitter,
    util = require("util");

/**
@class Job
@constructor
*/
function Job(name){
    var self = this;
    
    this.name = name;
    this.complete = false;
    this.timer = null;
    
    this.run = function(){
        self.emit("starting", util.format("job %s: %s", self.name, "starting"));

        var commandOutput = this.command();
        if (commandOutput instanceof EventEmitter){
            commandOutput
                .on("starting", function(timer){
                    this.timer = timer;
                    self.emit("starting", timer);
                })
                .on("progress", function(progress){
                    self.emit("progress", progress);
                })
                .on("complete", function(timer){
                    self.complete = true;
                    this.timer = timer;
                    self.emit("complete", timer);
                })
                .on("info", function(msg){
                    self.emit("info", msg);
                })
                .on("warning", function(msg){
                    self.emit("warning", msg);
                })
                .on("error", function(err){
                    self.emit("error", err);
                })
                .on("terminated", function(){
                    self.emit("terminated");
                });
                
        } else {
            self.emit("complete", util.format("job %s: %s", self.name, "complete"));
            this.complete = true;
        }
    };
}
Job.prototype = new EventEmitter();
Job.prototype.command = function(){
    console.log("add a job yer cunt. ");
}

/**
@class CommandHandle
@constructor
*/
function CommandHandle(){}
CommandHandle.prototype = new EventEmitter();

// event definitions
var e = {
    /**
    @event info
    @param String message
    */
    info: "info",
    
    /**
    @event warning
    @param String message
    */
    warning: "warning",
    
    /**
    @event error
    @param String message
    */
    error: "error",
    
    /**
    @event starting
    @param {EncodeQueueStats} stats
    */
    starting: "starting",

    /**
    @event progress
    @param {Progress} progress
    */
    progress: "progress",
    
    /**
    @event complete
    @param {EncodeQueueStats} stats
    */
    complete: "complete",

    /**
    @event terminated
    */
    terminated: "terminated"
};

module.exports = Job;