#!/usr/bin/env node

// module dependencies
var	util = require("util"),
	colours = require("colors"),
	_ = require("underscore"),
	Veelo = require("./lib/veelo"),
	Config = require("./lib/config");

// colours setup
colours.setTheme({
	fileName: "bold",
	hbOutput: "grey",
	em: "italic",
	error: "red",
	strong: "bold",
	warning: "red"
});

// standard console writing method
function log(){
	var args = Array.prototype.slice.call(arguments)
		addDate = args.shift();
	if (addDate){
        args[0] = util.format("[%s] %s", new Date().toLocaleTimeString(), args[0]);
	} 
    console.log.apply(this, args);
}

function stdoutWrite(data){
    process.stdout.write(data.hbOutput);
}

// instantiate Veelo and attach listeners
var config = new Config({
    configDefinition: Veelo.configDefinition,
    getPassedIn: true
});
var veelo = new Veelo(config);

veelo.on("error", function(err){
	log(true, err);
	process.exit(1);	
});

veelo.on("message", function(msg){
	log(false, msg);
});

veelo.on("report", function(report){
	log(false, report);
});

veelo.queue.on("message", function(msg){
	if(!config.options.veelo["dry-run"]) log(true, msg);
});

veelo.queue.on("handbrake-output", function(msg){
	stdoutWrite(msg);
});

veelo.queue.on("begin", function(){
	log(true, "queue length: %d", this.stats.valid);
	log(true, "file types: %s", _.map(this.stats.ext, function(value, key){
		return util.format("%s(%d)", key, value);
	}).join(" "));
});

veelo.queue.on("complete", function(){
	var stats = this.stats;

	log(true, "%d jobs processed in %s (%d successful, %d failed).", stats.valid, stats.elapsed, stats.successful, stats.failed);
	if (this.jobs.failed.length > 0){
		log(true, "the following files failed to encode: ");
		this.jobs.failed.forEach(function(job){
			log(false, job.inputPath.fileName);
		});
	}
});

veelo.queue.on("processing", function(file){
	log(true, "processing: %s", file.fileName);
});

veelo.queue.on("error", function(err){
	log(true, "Error: ".error + err);
	log(false, "Please check your regular expression syntax and try again.".strong);
	process.exit(0);
});

veelo.queue.on("job-fail", function(data){
   log(true, "%s [%s]", data.msg, data.inputPath.fileName);
   if (data.output) log(false, data.output);
});

// start work
veelo.start();