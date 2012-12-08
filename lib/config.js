var	path = require("path"),
	colours = require("colors"),
	fs = require("fs");

// define .handbraker path
var configPath = process.platform == "win32"
	? path.join(process.env.APPDATA, ".handbraker")
	: path.join(process.env.HOME, ".handbraker");

// create .handbraker
if (!fs.existsSync(configPath)){
	fs.writeFileSync(configPath, fs.readFileSync(path.resolve(__dirname, "../options.json")));
}
	
// expose options
try {
	module.exports = JSON.parse(fs.readFileSync(configPath));
} catch (err){
	console.error("Fatal error parsing config: ".red + err);
	console.error("Please ensure this config file is valid JSON: " + configPath);
	process.exit(1);
}
