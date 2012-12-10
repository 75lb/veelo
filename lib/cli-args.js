var	optimist = require("optimist");

var	argv = optimist
	.options("archive", { boolean: true })
	.options("v", { boolean: true, alias: "verbose" })
	.options("h", { boolean: true, alias: "help" })
	.options("hbhelp", { boolean: true })
	.options("ext", { string: true })
	.options("embed-srt", { boolean: true })
	.options("preserve-dates", { boolean: true })
	.options("recurse", { boolean: true })
	.options("include", { string: true })
	.options("exclude", { string: true })
	.options("dry-run", { boolean: true })
	.options("output-dir", { string: true })
	.argv;

// override annoying optimist behaviour which always sets booleans to false if not passed in
function notInProcessArgv(arg){
	return process.argv.indexOf(arg) === -1;
}
if (notInProcessArgv("--archive")) delete argv.archive;
if (notInProcessArgv("-v")) delete argv.v;
if (notInProcessArgv("--verbose")) delete argv.verbose;
if (notInProcessArgv("--embed-srt")) delete argv["embed-srt"];
if (notInProcessArgv("--preserve-dates")) delete argv["preserve-dates"];
if (notInProcessArgv("--recurse")) delete argv.recurse;
if (notInProcessArgv("--dry-run")) delete argv["dry-run"];

// override optimist behaviour to set an empty string to boolean true
if (argv.include === true) argv.include = "";
if (argv.exclude === true) argv.exclude = "";

module.exports = {
	options: argv,
	files: argv._.map(function(file){ return file.toString(); })
};