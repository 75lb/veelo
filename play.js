var EventEmitter = require("events").EventEmitter,
    util = require("util");

function Queue(){
    var _jobs = [];
    var self = this;
    
    this.add = function(job){
        _jobs.push(job);
        job.on("progress", function(progress){
            self.emit("progress", progress);
        });
        job.on("complete", function(){
            if (_jobs.every(function(job){ return job.complete; })){
                self.emit("complete", "queue complete");
            }
        })
    };
    
    this.start = function(){
        self.emit("starting", "queue starting");
        _jobs.forEach(function(job){
            job.run();
        })
    };
}
Queue.prototype = new EventEmitter();

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
    }
}
Job.prototype = new EventEmitter();
Job.prototype.command = function(){
    console.log("add a job yer cunt. ");
}

function l(msg){
    console.log(msg);
}

var q = new Queue();
q.on("starting", l)
 .on("progress", l)
 .on("complete", l);

var a = new Job("first");
q.add(a);

a.command = function(){
    console.log("COMMAND A BITCH");
}

var b = new Job("second");
q.add(b);

b.command = function(){
    var output =  new EventEmitter();
    setTimeout(function(){ output.emit("progress", 10); }, 100);
    setTimeout(function(){ output.emit("progress", 20); }, 200);
    setTimeout(function(){ output.emit("complete"); }, 300);    
    return output;
};

var c = new Job("third");
q.add(c);

c.command = function(){
    var output =  new EventEmitter();
    setTimeout(function(){ output.emit("progress", 10); }, 30);
    setTimeout(function(){ output.emit("progress", 20); }, 100);
    setTimeout(function(){ output.emit("complete"); }, 320);    
    return output;
};

q.start();