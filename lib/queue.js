var EventEmitter = require("events").EventEmitter,
    Timer = require("./general").Timer,
    util = require("util");

// event definitions
/**
@event info
@param String message
*/
/**
@event warning
@param String message
*/
/**
@event error
@param String message
*/
/**
@event starting
@param {Timer} timer
*/
/**
@event progress
@param {Progress} progress
*/
/**
@event complete
@param {Timer} timer
*/
/**
@event terminated
*/

/**
@class Queue
@constructor
*/
function Queue(){
    var _jobs = [];
    var self = this;
    
    this.timer = null;
    
    this.add = function(job){
        _jobs.push(job);
    };
    
    this.start = function(){
        this.timer = new Timer().start();
        self.emit("starting", this.timer);
        
        _jobs.forEach(function(job){
            job.on("progress", function(progress){
                    self.emit("progress", progress);
                })
                .on("complete", function(){
                    if (_jobs.every(function(job){ return job.complete; })){
                        self.timer.stop();
                        self.emit("complete", self.timer);
                    }
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