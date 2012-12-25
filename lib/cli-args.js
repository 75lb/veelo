var _ = require("underscore");

exports.getArgs = getArgs;
exports._inject = function(a){
    argv = a;
};

var argv = process.argv;

function l(msg){ console.log(msg); }

function getArgs(optionDefinitions){
    argv.splice(0, 2);

    // expand aliases

    var output = {
        args: {},
        files: [],
        invalid: []
    };

    // extract valid options
    _.each(optionDefinitions, function(def, option){
        if(argPassedIn(option, def.alias)){
            output.args[option] = pickArgValue(option, def.alias, def.type) 
        }
    });
    
    // remaining options are invalid
    output.invalid = argv.filter(function(arg){return arg.substr(0,1) === "-"});
    argv = argv.filter(function(arg){return arg.substr(0,1) !== "-"});

    output.files = argv;
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
