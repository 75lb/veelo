// module dependencies
var fs = require("fs"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	path = require("path"),
	_ = require("underscore"),
	Job = require("./job");

module.exports = Queue;

var _isCancelled = false,
	_config;

function Queue(config){
	var self = this;
	_config = config;
	
	this.stats = {
		start: null, end: null, elapsed: "",
		valid: 0, invalid: 0,
		ignored: 0,	
		failed: 0, successful: 0,
		ext: {}
	};

	this.jobs = {
		valid: [],
		invalid: [],
		failed: function(){
			return jobs.valid.filter(function(job){
				return job.completed && job.successful === false; 
			});
		},
		successful: function(){
			return jobs.valid.filter(function(job){
				return job.completed && job.successful === true; 
			});
		}
	};

	// listeners
	this.on("complete", function(){
		self.stats.end = Date.now();
		var elapsed = new Date(self.stats.end - self.stats.start),
			hours = elapsed.getHours(),
			minutes = elapsed.getMinutes(),
			seconds = elapsed.getSeconds();
		self.stats.elapsed = 
			(hours ? hours + "h ": "") + 
			(minutes ? minutes + "m " : "") + 
			(seconds ? seconds + "s" : "0s");
	});
	
	this.on("begin", function(){
		self.stats.start = Date.now();
	});	
}
Queue.prototype = new EventEmitter();

Queue.prototype.add = function(files){
	var self = this,
		stats = this.stats,
		jobs = this.jobs;
		
	// Recurse mode
	if (_config.options.handbraker.recurse){
		files = this.expandFileList(files);
	}

	files.forEach(function(filePath){
		var job = new Job(_config, filePath);
		job.on("invalid", function(e){
			stats.invalid++;
			jobs.invalid.push(job);
			if (!e.code == Job.e.FILE_IGNORED){
				self.emit("message", e.msg);
			}
		});
		job.on("valid", function(){
			stats.valid++;
			var ext = path.extname(job.inputPath).toLowerCase();
			stats.ext[ext] = (stats.ext[ext] || 0) + 1;
			jobs.valid.push(job);
		});
		job.on("processing", function(file){
			self.emit("processing", file);
		});

		job.init();
	});
};

Queue.prototype.process = function(){
	var self = this,
		stats = this.stats;
	if (this.jobs.valid.length > 0){
		this.emit("begin");
		
		function processNext(jobs){
			var job = jobs.shift();
			if (job && !_isCancelled){
				job.on("success", function(){
					stats.successful++;
					processNext(jobs);
				});
				job.on("fail", function(){
					stats.failed++;
					processNext(jobs);
				});
				job.on("message", function(msg){
					self.emit("message", msg);
				});
				job.process();
			} else {
				self.emit("complete");
			}
		}
		processNext(this.jobs.valid);
	} 
};

Queue.prototype.cancel = function(){
	_isCancelled = true;
};

Queue.prototype.getReport = function(){
	var output = "";
	function addLine(){
		output += util.format.apply(this, arguments);
		output += "\n";
	}
	if (this.stats.valid > 0){
		addLine("\nThe following input files will be", "processed:".strong, "\n");
		this.jobs.valid.forEach(function(job){
			addLine(job.inputPath);
		});

		addLine("\n%s will land in these directories:", "output".strong);
		var distinctDirs = [];
		this.jobs.valid.forEach(function(job){
			distinctDirs.push(path.dirname(job.outputPath));
		})
		distinctDirs = _.uniq(distinctDirs);
		distinctDirs.forEach(function(dir){
			addLine(dir);
		});
		
		if (_config.options.handbraker.archive){
			addLine("\nThe input files will be %s to these directories: ", "archived".strong);
			distinctDirs = [];
			this.jobs.valid.forEach(function(job){
				distinctDirs.push(path.dirname(job.archivePath));
			});
			distinctDirs = _.uniq(distinctDirs);
			distinctDirs.forEach(function(dir){
				addLine(dir);
			});
		}
	}
		
	if (this.stats.invalid > 0){
		addLine("\nThe following files are %s", "invalid:".strong);
		this.jobs.invalid.forEach(function(job){
			addLine(job.inputPath);
		});
	}
			
	return output;
}

Queue.prototype.expandFileList = function(filePaths){
	// Recurse mode
	var output = [],
		self = this,
		args = _config.options.handbraker;
		
	filePaths.forEach(function(filePath){
		if (fs.existsSync(filePath)){
			if (fs.statSync(filePath).isDirectory()){
				var dirListing = fs.readdirSync(filePath).map(function(file){
					return path.join(filePath, file);
				});
				output = output.concat(self.expandFileList(dirListing));
			} else {
				try{
					if (fileShouldBeIncluded(filePath, args.include, args.exclude)){
						output.push(filePath);
					}
				} catch (err){
					self.emit("error", err);
				}
			}
		} else {
			self.emit("message", "file does not exist: " + filePath);
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
