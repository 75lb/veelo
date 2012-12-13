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
			files: argv._.map(function(file){ 
					return file.toString(); 
				})
		};
	delete argv._;
	delete argv.$0;
	
	// validate
	var invalidOptions = [];
	process.argv.shift();
	process.argv.shift();
	// console.log(process.argv);
	for (var i=0; i < process.argv.length ; i++){
		var option = process.argv[i];
		// console.log(option);
		if (option.substr(0,2) == "--"){
			option = option.replace("--", "");
			if (!allOptionsCombined.some(function(o){return o.name == option;})){
				invalidOptions.push(option);
			}
		} else if (option.substr(0,1) == "-") {
			option = option.replace("-", "");
			if (!allOptionsCombined.some(function(o){return o.alias == option;})){
				invalidOptions.push(option);
			}
		}
	}
	if (invalidOptions.length > 0){
		console.log("invalid options: ");
		console.log(invalidOptions);
		process.exit(0);
	} 
	
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

	// create the 'passed-in' object
	configGroups.forEach(function(group){
		var passedInGroup = passedIn[group.name] = {};
		group.options.forEach(function(option){
			if (argv[option.name]){
				passedInGroup[option.name] = argv[option.name];
			}
			if (argv[option.alias]){
				passedInGroup[option.alias] = argv[option.alias];
			}
		});
	});
	
	return passedIn;
}

// // override optimist behaviour to set an empty string to boolean true
// if (argv.include === true) argv.include = "";
// if (argv.exclude === true) argv.exclude = "";
