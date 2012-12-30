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
        var isAlias = false;
        l(option);
        l(def);
        
        // alias
        if (typeof def === "string"){
            // option = def;
            def = optionDefinitions[def];
            isAlias = true;
        }
        l(option);
        l(def);
        if(argPassedIn(option, isAlias)){
            output.args[option] = pickArgValue(option, isAlias, def.type) 
        }
    });
    
    // remaining options are invalid
    output.invalid = argv.filter(function(arg){return arg.substr(0,1) === "-"});
    argv = argv.filter(function(arg){return arg.substr(0,1) !== "-"});

    output.files = argv;
    return output;
}

function pickArgValue(option, isAlias, type){
    option = isAlias
        ? "-" + option
        : "--" + option;

    if (type === "boolean" ){
        argv = _.without(argv, option);
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
        
        return argValue || "";
    }
}

function argPassedIn(arg, isAlias){
    arg = isAlias
        ? "-" + arg
        : "--" + arg;
    return argv.indexOf(arg) > -1;
}
