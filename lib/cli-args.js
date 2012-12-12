var	optimist = require("optimist"),
	_ = require("underscore");

module.exports = getCliArgs;

function getCliArgs(configGroups){
	var allOptions = [],
		output = {};
		
	configGroups.forEach(function(group){
		allOptions = allOptions.concat(group.options);
	});
	
	if (allOptions){
		allOptions.forEach(function(option){
			var optimistOptions = {};
			if (option.type == "boolean"){
				optimistOptions.boolean = true;
			} else {
				optimistOptions.string = true;
			}
			if (option.alias){
				optimistOptions.alias = option.alias;
			}
			optimist = optimist.options(option.name, optimistOptions);
		})
	}
	
	var argv = optimist.argv;

	configGroups.forEach(function(group){
		var outputGroup = output[group.name] = {};
		group.options.forEach(function(option){
			outputGroup[option.name] = argv[option.name];
		});
	});
	
	return output;
}

function pickArgs(options){
	var argv = {};
	if (options){
		for (var key in options){
			var optimistOptions = {};
			if (options[key].boolean){
				optimistOptions.boolean = true;
			} else {
				optimistOptions.string = true;
			}
			if (options[key].alias){
				optimistOptions.alias = options[key].alias;
			}
			optimist = optimist.options(key, optimistOptions);
		}
	}
	return _.pick(argv, Object.keys(options));
}

// // override annoying optimist behaviour which always sets booleans to false if not passed in
// function notInProcessArgv(arg){
// 	return process.argv.indexOf(arg) === -1;
// }
// if (notInProcessArgv("--archive")) delete argv.archive;
// if (notInProcessArgv("-v")) delete argv.v;
// if (notInProcessArgv("--verbose")) delete argv.verbose;
// if (notInProcessArgv("--embed-srt")) delete argv["embed-srt"];
// if (notInProcessArgv("--preserve-dates")) delete argv["preserve-dates"];
// if (notInProcessArgv("--recurse")) delete argv.recurse;
// if (notInProcessArgv("--dry-run")) delete argv["dry-run"];
// if (notInProcessArgv("--help")) delete argv["help"];
// if (notInProcessArgv("-h")) delete argv["h"];
// if (notInProcessArgv("--hbhelp")) delete argv["hbhelp"];
// 
// // override optimist behaviour to set an empty string to boolean true
// if (argv.include === true) argv.include = "";
// if (argv.exclude === true) argv.exclude = "";
// 
// delete argv._;
// delete argv.$0;
// 
// var inputFiles = argv._.map(function(file){ 
// 	return file.toString(); 
// });
// 
// module.exports = {
// 	options: argv,
// 	files: inputFiles
// };