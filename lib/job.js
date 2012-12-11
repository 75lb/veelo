// module dependencies
var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	fse = require("fs-extra"),
	// _ = require("underscore"),
	HandbrakeCLI = require("./handbrakeCli");

// exposed API
module.exports = Job;

// privates
var _config;

// main class definition
function Job(config, inputPath){
	_config = minimumConfig(config);

	var self = this,
		options = _config.options;
		
	this.valid = null;
	this.inputPath = inputPath;
	this.archivePath = getArchivePath(
		this.inputPath,
		options.handbraker.archive,
		_config.archiveDirectory
	);
	this.outputPath = getOutputPath(
		this.inputPath, 
		options.handbraker["output-dir"], 
		options.handbraker.ext
	);
	this.workingPath = replaceFileExtension(
		path.join(
			path.dirname(this.inputPath), 
			".processing." + path.basename(this.inputPath)
		), 
		options.handbraker.ext
	);
	this.completed = false;
	this.successful = false;
	
	this.on("success", function(){
		self.completed = true;
		self.successful = true;
	});
	this.on("fail", function(){
		self.completed = true;
	});
};

Job.prototype = new EventEmitter();

Job.prototype.init = function(){
	var self = this,
		file = this.inputPath;

	if(!fs.existsSync(file)){
		this.valid = false;
		this.emit("invalid", "validation failed, file does not exist: " + file.fileName);
	} else if(!fs.statSync(file).isFile()){
		this.valid = false;
		var msg = "validation failed, not a video file: " + file.fileName;
		if (fs.statSync(file).isDirectory()){
			msg += "\nTip: to process a directory, pass --recurse"
		}
		this.emit("invalid", msg);
	} else if (fileIgnored(file, _config.ignoreList)){
		this.valid = false;
	} else{
		this.valid = true;
		this.emit("valid");
	}
};

Job.prototype.process = function(){
	var self = this,
		options = _config.options;
		
	if (!this.valid) throw "attempt to process an invalid file";
	
	var processArgs = options.handbrake.concat([
		"-i", this.inputPath, 
		"-o", this.workingPath
	]);

	// embed subtitles
	var srtPath = this.inputPath.replace(/\.\w+$/, "." + "srt");
	if (options.handbraker["embed-srt"] && fs.existsSync(srtPath)){
	 	processArgs = processArgs.concat(["--srt-file", srtPath]);
		this.emit("message", "embedding external subs: " + srtPath);
	}

	var handbrakeCLI = new HandbrakeCLI();
	handbrakeCLI.on("fail", function(){
		self.emit("fail");
	});
	handbrakeCLI.on("terminated", function(){
		fs.unlink(self.workingPath);
	});
	handbrakeCLI.on("success", function(){
		// move input to archive
		if (options.handbraker.archive){
			var archiveDir = path.dirname(self.archivePath);
			if (!fs.existsSync(archiveDir)){
				fs.mkdirSync(archiveDir);
			}
			self.archivePath = checkSafePath(self.archivePath);
			fs.renameSync(self.inputPath, self.archivePath);
			
		// create output-dir
		} else if (options.handbraker["output-dir"]){
			var dir = path.dirname(self.outputPath);
			if (!fs.existsSync(dir)){
				fse.mkdirsSync(dir);
			}
		}

		if (fs.existsSync(self.workingPath)){
			self.outputPath = checkSafePath(self.outputPath);
			fse.copy(self.workingPath, self.outputPath, function(err){
				if (err) throw err;
				fs.unlinkSync(self.workingPath);				
				if(options.handbraker["preserve-dates"]){
					var inputFileStats = fs.statSync(options.handbraker.archive ? self.archivePath : self.inputPath);
					fs.utimesSync(self.outputPath, inputFileStats.atime, inputFileStats.mtime);
				}
			})
		}

		self.emit("success");
	});
	
	this.emit("processing", this.inputPath.fileName);
	handbrakeCLI.spawn(processArgs, options.handbraker.v || options.handbraker.verbose);
};

// internal functions
function fileIgnored(file, ignoreList){
	return ignoreList.some(function(ignoredFile){
		return ignoredFile == path.basename(file); 
	});
}

function checkSafePath (path){
	if (fs.existsSync(path)){
		return checkSafePath(path.replace(/\.(\w+)$/, "_.$1"));
	} else {
		return path;
	}
};

function getOutputPath(inputPath, outputDir, ext){
	var outputPath = replaceFileExtension(inputPath, ext);

	// output directory
	if(outputDir){
		outputDir = outputDir.trim();
		if (/^\.\//.test(outputDir) || /^\//.test(outputDir) || /\.\.\//.test(outputDir)){
			outputPath = path.join(outputDir, outputPath);
		} else {
			outputPath = path.join(path.dirname(outputPath), outputDir, path.basename(outputPath));
		}
	}
		
	return outputPath;
}

function getArchivePath(inputPath, archive, archiveDir){
	if (archive){
		return path.join(path.dirname(inputPath), archiveDir, path.basename(inputPath));
	} else {
		return "";
	}
}

function replaceFileExtension(file, ext){
	return file.replace(/\.\w+$/, "." + ext)	
}

function minimumConfig(config){
	config.archiveDirectory = config.archiveDirectory || "handbraker-originals";
	config.options.handbraker.ext = config.options.handbraker.ext || "m4v";
	return config;
}