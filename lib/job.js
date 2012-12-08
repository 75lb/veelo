// module dependencies
var fs = require("fs"),
	fse = require("fs-extra"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	path = require("path"),
	HandbrakeCLI = require("./handbrakeCli");

module.exports = Job;

function Job(options, inputPath){
	var self = this,
		handbrakerArgs = options.args.handbraker;
	
	this.options = options;
	this.valid = null;
	this.inputPath = inputPath;
	this.archivePath = getArchivePath(
		this.inputPath,
		handbrakerArgs.archive,
		handbrakerArgs.archiveDirectory
	);
	this.outputPath = getOutputPath(
		this.inputPath, 
		handbrakerArgs["output-dir"], 
		handbrakerArgs.ext
	);
	this.workingPath = replaceFileExtension(
		path.join(path.dirname(this.inputPath), ".processing." + path.basename(this.inputPath)), 
		handbrakerArgs.ext
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

Job.prototype.initialise = function(){
	var self = this,
		file = this.inputPath;

	if(!fs.existsSync(file)){
		this.valid = false;
		this.emit("invalid", "validation failed, file does not exist: " + file.fileName);
	} else if(!fs.statSync(file).isFile()){
		this.valid = false;
		this.emit("invalid", "validation failed, not a video file: " + file.fileName);
	} else if (fileIgnored(file, this.options.config.ignoreList)){
		this.valid = false;
		this.emit("ignored");
	} else{
		this.valid = true;
		this.emit("valid");
	}
};

function fileIgnored(file, ignoreList){
	return ignoreList.some(function(ignoredFile){
		return ignoredFile == path.basename(file); 
	});
}

Job.prototype.process = function(){
	var self = this,
		handbrakerArgs = this.options.args.handbraker;
		
	if (!this.valid) throw "attempt to process an invalid file";
	this.emit("processing", this.inputPath.fileName);
	
	var processArgs = this.options.args.handbrake.concat([
		"-i", this.inputPath, 
		"-o", this.workingPath
	]);

	// embed subtitles
	var srtPath = this.inputPath.replace(/\.\w+$/, "." + "srt");
	if (handbrakerArgs["embed-srt"] && fs.existsSync(srtPath)){
	 	processArgs = processArgs.concat(["--srt-file", srtPath]);
		this.emit("message", "embedding external subs: " + srtPath);
	}

	var handbrake = new HandbrakeCLI();
	handbrake.on("fail", function(){
		self.emit("fail");
	});
	handbrake.on("success", function(){
		// move input to archive
		if (handbrakerArgs.archive){
			var archiveDir = path.dirname(self.archivePath);
			if (!fs.existsSync(archiveDir)){
				fs.mkdirSync(archiveDir);
			}
			self.archivePath = checkSafePath(self.archivePath);
			fs.renameSync(self.inputPath, self.archivePath);
			
		// create output-dir
		} else if (handbrakerArgs["output-dir"]){
			var dir = path.dirname(self.outputPath);
			if (!fs.existsSync(dir)){
				fse.mkdirsSync(dir);
			}
		}

		if (fs.existsSync(self.workingPath)){
			self.outputPath = checkSafePath(self.outputPath);
			fse.copy(self.workingPath, self.outputPath, function(err){
				// fs.renameSync(self.workingPath, self.outputPath);
				if (err) throw err;
				fs.unlinkSync(self.workingPath);				
				if(handbrakerArgs["preserve-dates"]){
					var inputFileStats = fs.statSync(handbrakerArgs.archive ? self.archivePath : self.inputPath);
					fs.utimesSync(self.outputPath, inputFileStats.atime, inputFileStats.mtime);
				}
			})
		}
			
		self.emit("success");
	});
	handbrake.spawn(processArgs, handbrakerArgs.v || handbrakerArgs.verbose);
};

// internal functions
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
	var HANDBRAKER_OLD = archiveDir || "handbraker-originals";
	if (archive){
		return path.join(path.dirname(inputPath), HANDBRAKER_OLD, path.basename(inputPath));
	} else {
		return "";
	}
}

function replaceFileExtension(file, ext){
	return file.replace(/\.\w+$/, "." + ext)	
}