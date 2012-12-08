#!/usr/bin/env node

// module dependencies
var	util = require("util"),
	colours = require("colors"),
	_ = require("underscore"),
	Handbraker = require("./lib/handbraker"),
	args = require("./lib/args"),
	config = require("./lib/config");

// setup
colours.setTheme({
	fileName: "bold",
	hbOutput: "grey",
	em: "italic",
	error: "red",
	strong: "bold"
});

// standard console writing method
function log(){
	var args = Array.prototype.slice.call(arguments)
		addDate = args.shift();
	if (addDate) args[0] = util.format("[%s] %s", new Date().toLocaleTimeString(), args[0]);
	console.log.apply(this, args);
}

// instantiate Handbraker and attach listeners
var handbraker = new Handbraker(args, config);

handbraker.on("error", function(err){
	log(true, err);
	process.exit(1);	
});

handbraker.on("message", function(msg){
	log(false, msg);
});

handbraker.queue.on("report", function(report){
	log(false, report);
})

handbraker.queue.on("message", function(msg){
	if(!handbraker.options.args.handbraker["dry-run"]) log(true, msg);
});

handbraker.queue.on("begin", function(){
	log(true, "queue length: %d", this.stats.valid);
	log(true, "file types: %s", _.map(this.stats.ext, function(value, key){
		return util.format("%s(%d)", key, value);
	}).join(" "));
});

handbraker.queue.on("complete", function(){
	var stats = this.stats;

	log(true, "%d jobs processed in %s (%d successful, %d failed).", stats.valid, stats.elapsed, stats.successful, stats.failed);
	if (this.jobs.failed.length > 0){
		log(true, "the following files failed to encode: ");
		this.jobs.failed.forEach(function(job){
			log(false, job.inputPath.fileName);
		});
	}
});

handbraker.queue.on("processing", function(file){
	log(true, "processing: %s", file.fileName);
});

handbraker.queue.on("error", function(err){
	log(true, "Error: ".error + err);
	log(false, "Please check your regular expression syntax and try again.".strong);
	process.exit(0);
});

// start work
handbraker.start();