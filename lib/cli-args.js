var _ = require("underscore");

exports.getArgs = getArgs;
exports._inject = function(a){ 
    process.argv = a; 
    argv = process.argv;
};

var argv;
argv = process.argv;
function l(msg){ console.log(msg); }

function getArgs(optionDefinitions){
    argv.splice(0, 2);

    var output = {
        args: {},
        files: []
    };

    _.each(optionDefinitions, function(def, option){
        if(argPassedIn(option, def.alias)){
            output.args[option] = pickArgValue(option, def.alias, def.type) 
        }
    });

    output.files = argv;
    l(output);
    return output;
}

function pickArgValue(option, alias, type){
    option = "--" + option;
    alias = alias ? "-" + alias : null;
    if (type == "boolean" ){
        argv = _.without(argv, option, alias);
        return true;
    } else {
        var argPos = argv.indexOf(option),
            argValuePos = argPos + 1,
            argValue = "";
        
        if (argPos > -1){
            if (argValuePos < argv.length){
                argValue = argv[argValuePos];
            }
            argv.splice(argPos, argValue ? 2 : 1);
        }
        
        var aliasPos = argv.indexOf(alias),
            aliasValuePos = aliasPos + 1,
            aliasValue;
        
        if (aliasPos > -1){
            if (aliasValuePos < argv.length){
                aliasValue = argv[aliasValuePos];
            }
            argv.splice(aliasPos, aliasValue ? 2 : 1);
        }
        
        return argValue || aliasValue || "";
    }
}

function argPassedIn(arg, alias){
    arg = "--" + arg;
    alias = "-" + alias;
    return argv.indexOf(arg) > -1 || argv.indexOf(alias) > -1;
}

function getArgs1(optionDefinitions){
    var optimist = require("optimist"), 
        output = {};
    
    _.each(optionDefinitions, function(value, key){
		var optimistConfig = {};
		if (value.type === "boolean"){
			optimistConfig.boolean = true;
		} else {
			optimistConfig.string = true;
		}
		if (value.alias){
			optimistConfig.alias = value.alias;
		}
        console.log("%s: %s", key, JSON.stringify(optimistConfig));
		optimist = optimist.options(key, optimistConfig);
    });
    
    // parse options, force all filenames to be a string (not a number, e.g. 2004)
    output.args = optimist.argv;
    output.files = optimist.argv._.map(function(file){ 
		return file.toString(); 
	});
	delete output.args._;
	delete output.args.$0;
    
	// override annoying optimist behaviour which always sets booleans to false if not passed in
	function notPassedIn(arg){
		return process.argv.indexOf(arg) === -1;
	}
	_.each(optionDefinitions, function(optionDefinition){
		if (notPassedIn("--" + optionDefinition.name) && notPassedIn("-" + optionDefinition.alias)){
			delete optimist.argv[optionDefinition.name];
			delete optimist.argv[optionDefinition.alias];
		}
	});
    
    return output;
}

function CliArgs(configGroups){
	var allOptionsCombined = [];

	configGroups.forEach(function(group){
		allOptionsCombined = allOptionsCombined.concat(group.options);
	});
	
    // configure optimist
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
	
    // parse options, force all filenames to be a string (not a number, e.g. 2004)
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
    
    // ditch first two args
	process.argv.shift(); process.argv.shift();
    // console.log(process.argv);
    
    
	for (var i=0; i < process.argv.length ; i++){
		var option = process.argv[i];
		// console.log(option);
		if (option.substr(0,2) == "--"){
			option = option.replace("--", "");
			if (!allOptionsCombined.some(function(o){return o.name == option;})){
				invalidOptions.push("--" + option);
			}
		} else if (option.substr(0,1) == "-") {
			option = option.replace("-", "");
			if (!allOptionsCombined.some(function(o){return o.alias == option;})){
				invalidOptions.push("-" + option);
			}
		}
	}
	if (invalidOptions.length > 0){
		console.log("invalid options: ");
		console.log(invalidOptions);
		process.exit(0);
	} 
	
	// console.log(argv);
	
	// override annoying optimist behaviour which always sets booleans to false if not passed in
	function notInProcessArgv(arg){
		return process.argv.indexOf(arg) === -1;
	}
	configGroups.forEach(function(group){
		group.options.forEach(function(option){
			if (notInProcessArgv("--" + option.name) && notInProcessArgv("-" + option.alias)){
				delete argv[option.name];
				delete argv[option.alias];
			}
		});
	});

	// console.log(argv);
	
	// create the 'passed-in' object
	configGroups.forEach(function(group){
		var passedInGroup = passedIn[group.name] = {};
		group.options.forEach(function(option){
			if (argv[option.name] !== undefined){
				passedInGroup[option.name] = argv[option.name];
			}
			if (argv[option.alias] !== undefined){
				passedInGroup[option.alias] = argv[option.alias];
			}
		});
	});
	
	return passedIn;
}
