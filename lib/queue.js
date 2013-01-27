/**
Encoding Queue class 
@class Queue
@constructor
*/
function Queue(){}   

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
    @param QueueStats stats
    */
    starting: "starting",

    /**
    @event progress
    */
    progress: "progress"
    
    /**
    @event complete
    @param QueueStats stats
    */
    complete: "complete",
    
    /**
    @event job-fail
    */
    jobFail: "job-fail",
    
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
@class QueueStats
@constructor
*/
function QueueStats(){
    /**
    @method clone
    @return QueueStats
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
