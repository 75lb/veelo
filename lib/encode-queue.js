var EventEmitter = require("events").EventEmitter,
    _ = require("underscore");

/**
Encoding Queue class 
@module veelo
@class EncodeQueue
@constructor
*/
function EncodeQueue(){}
EncodeQueue.prototype = new EventEmitter();

// event definitions
var e = {
    /**
    @event info
    @param String info
    */
    info: "info",
    
    /**
    @event warning
    */
    warning: "warning",
    
    /**
    @event error
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
    @event job-fail
    */
    jobFail: "job-fail"
};

/**
@property valid
@type Array
*/

/**
@property invalid
@type Array
*/

/**
@method cancel
*/

/**
@class EncodeQueueStats
@constructor
*/
function EncodeQueueStats(){
    /**
    @method clone
    @return EncodeQueueStats
    */
    this.clone = function(){
        return {
            time: _.clone(this.time),
            jobs: _.clone(this.jobs)
        };
    };
    
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

module.exports = EncodeQueue;