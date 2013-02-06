var EventEmitter = require("events").EventEmitter,
    util = require("util");

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

/**
@class Queue
@constructor
*/
function Queue(){
    var _jobs = [];
    var self = this;
    
    this.add = function(job){
        _jobs.push(job);
    };
    
    this.start = function(){
        self.emit("starting", "queue starting");
        
        _jobs.forEach(function(job){
            job.on("progress", function(progress){
                    self.emit("progress", progress);
                })
               .on("complete", function(){
                   if (_jobs.every(function(job){ return job.complete; })){
                       self.emit("complete", "queue complete");
                   }
               })
               .run();
        })
    };
}
Queue.prototype = new EventEmitter();

/**
@class QueueStats
@constructor
*/
function QueueStats(){
    /**
    @property time
    @type Object
    */
    this.time = {
        start: null, 
        end: null, 
        total: null
    };
    
    /**
    @property jobs
    @type Object
    */    
    this.jobs = {
        valid: 0, 
        invalid: 0,
        ignored: 0,    
        failed: 0, 
        successful: 0,
        fileExtensions: {}
    };
}

module.exports = Queue;