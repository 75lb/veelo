var	optimist = require("optimist"),
	_ = require("underscore");

module.exports = CliArgs;

function CliArgs(configGroups){
	var allOptionsCombined = [];
		
	configGroups.forEach(function(group){
		allOptionsCombined = allOptionsCombined.concat(group.options);
	});
	
	if (allOptionsCombined){
		allOptionsCombined.forEach(function(option){
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
	
	var argv = optimist.argv,
		passedIn = {
			files: argv._	
		};
	delete argv._;
	delete argv.$0;
	
	// override annoying optimist behaviour which always sets booleans to false if not passed in
	function notInProcessArgv(arg){
		return process.argv.indexOf(arg) === -1;
	}
	configGroups.forEach(function(group){
		group.options.forEach(function(option){
			if (notInProcessArgv("--" + option.name)) delete argv[option.name];
			if (notInProcessArgv("-" + option.alias)) delete argv[option.alias];
		});
	});	

	// create the 'passed-in'
	configGroups.forEach(function(group){
		var passedInGroup = passedIn[group.name] = {};
		group.options.forEach(function(option){
			if (argv[option.name] || argv[option.alias]){
				passedInGroup[option.name] = argv[option.name] || argv[option.alias];
			}
		});
	});
	
	for (option in argv){
		if (!allOptionsCombined.some(function(o){return o.name == option})){
			console.log("Unrecognised option: " + option);
		}
	}
	
	return passedIn;
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