var EventEmitter = require("events").EventEmitter,
    _ = require("underscore"),
    Job = require("./job");

// event definitions
var e = {
    info: "info",
    warning: "warning",
    error: "error",
    starting: "starting",
    progress: "progress",
    complete: "complete",
    cancelled: "cancelled"
};

var _jobs = {
    init: function(){
        this.valid = [];
        this.invalid = [];
    },

    failed: function(){
        return this.valid.filter(function(job){
            return job.is.complete && job.is.successful === false; 
        });
    },

    successful: function(){
        return this.valid.filter(function(job){
            return job.is.complete && job.is.successful === true; 
        });
    }
};
_jobs.init();

function EncodeQueue(files, encoderOptions, jobOptions){
    add(files);
}
EncodeQueue.prototype = new EventEmitter();

function add(files){

    // single file may be passed as a string
    if (typeof files === "string"){
        files = [files];
    }
    
    // Recurse mode
    if (config.get("recurse")){
        files = expandFileList(files);
    }

    files.forEach(function(filePath){
        var job = new Job({
            inputPath: filePath
        });
        job.on("invalid", function(msg){
            _stats.jobs.invalid++;
            _jobs.invalid.push(job);
            veelo.emit(e.msg, msg);
        });
        job.on("valid", function(){
            _stats.jobs.valid++;
            var ext = path.extname(filePath).toLowerCase();
            _stats.jobs.fileExtensions[ext] = (_stats.jobs.fileExtensions[ext] || 0) + 1;
            _jobs.valid.push(job);
        });
        job.on("processing", function(file){
            veelo.emit(e.processing, file);
        });

        job.validate();
    });

    return this;
};

EncodeQueue.prototype.clear = function(){
    _jobs.init();
    _stats.init();
    return this;
};

EncodeQueue.prototype.cancel = function(){
    _isCancelled = true;
};

EncodeQueue.prototype.getReport = function(){
    var output = "";
    function addLine(){
        output += util.format.apply(this, arguments);
        output += "\n";
    }
    if (_stats.jobs.valid > 0){
        addLine("\nThe following input files will be", "processed:".strong, "\n");
        _jobs.valid.forEach(function(job){
            addLine(job.path.input);
        });

        addLine("\n%s will land in these directories:", "output".strong);
        var distinctDirs = [];
        _jobs.valid.forEach(function(job){
            distinctDirs.push(path.dirname(job.path.output));
        })
        distinctDirs = _.uniq(distinctDirs);
        distinctDirs.forEach(function(dir){
            addLine(dir);
        });
        
        if (config.get("archive")){
            addLine("\nThe input files will be %s to these directories: ", "archived".strong);
            distinctDirs = [];
            _jobs.valid.forEach(function(job){
                distinctDirs.push(path.dirname(job.path.archive));
            });
            distinctDirs = _.uniq(distinctDirs);
            distinctDirs.forEach(function(dir){
                addLine(dir);
            });
        }
    }
        
    if (_stats.jobs.invalid > 0){
        addLine("\nThe following files are %s", "invalid:".strong);
        _jobs.invalid.forEach(function(job){
            addLine(job.path.input);
        });
    }
            
    return output;
};

EncodeQueue.prototype.start = function(){
    var self = this;
    if (_jobs.valid.length > 0){
            
        function processNext(){
            var job = _jobs.valid.shift();
            if (job && !_isCancelled){
                job.on("complete", function(){
                    _stats.jobs.successful++;
                    processNext();
                });
                job.on("error", function(data){
                    _stats.jobs.failed++;
                    self.emit(e.jobFail, data);
                    processNext();
                });
                job.on("message", function(msg){
                    self.emit(e.msg, msg);
                });
                job.on("output", function(msg){
                    veelo.emit(e.output, msg);
                });
                job.on("progress", function(progress){
                    progress.queuePosition = -1;
                    progress.queueSize = -1;
                    veelo.emit(e.progress, progress);
                });
                            
                job.process();
            } else {
                // on processing completion, record the 'end' and 'elapsed' times
                _stats.time.end = Date.now();
                var elapsed = new Date(_stats.time.end - _stats.time.start),
                    hours = elapsed.getHours(),
                    minutes = elapsed.getMinutes(),
                    seconds = elapsed.getSeconds();
                _stats.time.elapsed = 
                    (hours ? hours + "h ": "") + 
                    (minutes ? minutes + "m " : "") + 
                    (seconds ? seconds + "s" : "0s");
    
                self.emit(e.complete);
            }
        }
        processNext();
    } else {
        this.emit(e.msg, "nothing to process");
    }
}

function EncodeQueueStats(){
    this.clone = function(){
        return {
            time: _.clone(this.time),
            jobs: _.clone(this.jobs)
        };
    };
    this.time = {
        start: null, 
        end: null, 
        total: null
    };
    this.jobs = {
        valid: 0, 
        invalid: 0,
        ignored: 0,    
        failed: 0, 
        successful: 0,
        fileExtensions: {}
    };
}

function expandFileList(filePaths){
    // Recurse mode
    var output = [],
        self = this;
        
    filePaths.forEach(function(filePath){
        if (fs.existsSync(filePath)){
            if (fs.statSync(filePath).isDirectory()){
                var dirListing = fs.readdirSync(filePath).map(function(file){
                    return path.join(filePath, file);
                });
                output = output.concat(expandFileList(dirListing));
            } else {
                try{
                    if (fileShouldBeIncluded(filePath, config.get("include"), config.get("exclude"))){
                        output.push(filePath);
                    }
                } catch (err){
                    self.emit(e.error, err);
                }
            }
        } else {
            self.emit(e.msg, "file does not exist: " + filePath);
        }

    });
    return output;
}

function fileShouldBeIncluded(relativePath, include, exclude){
    // defaults 
    var included = true, 
        excluded = false;

    // exclude expression passed
    if (exclude){
        var exclude = new RegExp(exclude, "i");
        excluded = exclude.test(relativePath);
    }

    // include expression passed
    if (include){
        var include = new RegExp(include, "i");
        included = include.test(relativePath);
    }

    if(included && !excluded) return true;
}

EncodeQueue._inject = function(MockJob){
    Job = MockJob;
};

module.exports = EncodeQueue;