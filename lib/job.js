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
    
    this.run = function(){
        self.emit("starting", util.format("job %s: %s", self.name, "starting"));

        var commandOutput = this.command();
        if (commandOutput instanceof EventEmitter){
            commandOutput
                .on("progress", function(progress){
                    self.emit("progress", util.format("job %s progress: %s", self.name, progress));
                })
                .on("complete", function(){
                    self.complete = true;
                    self.emit("complete", util.format("job %s: %s", self.name, "complete"));
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
    @event cancelled
    */
    cancelled: "cancelled"
};

module.exports = Job;