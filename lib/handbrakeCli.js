// module dependencies
var	path = require("path"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	spawn = require("child_process").spawn, 
	exec = require("child_process").exec;

// exposed API
module.exports = HandbrakeCLI;

// privates 
var _HandbrakeCLIPath = 
	process.platform == "darwin"
		? path.join(__dirname, "../bin/HandbrakeCLI")
		: process.platform == "win32"
			? process.arch == "x64"
				? path.join(__dirname, "../bin/HandbrakeCLIx64.exe")
				: path.join(__dirname, "..", "bin", "HandbrakeCLIx32.exe")
			: "HandBrakeCLI";	

// main class definition
function HandbrakeCLI(){}
	
HandbrakeCLI.prototype = new EventEmitter();

HandbrakeCLI.prototype.spawn = function(processArgs, printOutput) {
	var output = "",
		self = this,
		handle = spawn(_HandbrakeCLIPath, processArgs);
		
	// a few commands should printOutput whether user passed --verbose or not
	if (processArgs && processArgs.some(function(arg){return arg == "-t" || arg == "--title" || arg == "--scan"})){
		printOutput = true;
	}
		
	handle.stdout.setEncoding("utf-8");
	handle.stderr.setEncoding("utf-8");
	handle.stdout.on("data", function(data){
		output += data;
		process.stdout.write(data.hbOutput);
	});
	handle.stderr.on("data", function(data){
		output += data;
		if (printOutput) process.stdout.write(data.hbOutput);
	});
	handle.on("exit", function(code, signal){
		if (signal == "SIGTERM"){
			self.emit("terminated");
				
		} else if (code && code != 0){
			console.log(output.hbOutput);
			util.log("there was an issue, HandbrakeCLI exit code: " + code);
			self.emit("fail");

		} else if (code == 0 && /No title found\./.test(output)){
			util.log("encode failed, not a video file: " + processArgs[processArgs.indexOf("-i") + 1].fileName);
			self.emit("fail");

		} else {
			self.emit("success");
		}
	});
		
	// handle a user CTRL+C
	process.on("SIGINT", function(){
		handle.kill();
	});
};

HandbrakeCLI.prototype.exec = function(processArgString, done){
	var cmd = util.format('"%s" %s', _HandbrakeCLIPath, processArgString);
	exec(cmd, function(err, stdout, stderr){
		if (err) throw err;
		done(stdout, stderr);
	});
};
