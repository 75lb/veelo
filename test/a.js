var _ = require("underscore");

function l(msg){ console.log(msg); }

var optionDefinitions = {
    version: {type: "boolean"},
    "output-dir": { type: "string", alias: "o" },
    other: {type: "string"},
    another: {type: "number"},
    recurse: {type: "boolean"},
    input: {type: "regex"}
};

var argv = process.argv;
argv.shift(); argv.shift();

var output = {};

_.each(optionDefinitions, function(def, option){
    if(argPassedIn(option, def.alias)){
        output[option] = pickArgValue(option, def.alias, def.type) 
    }
});

l(output);
l(argv);

function pickArgValue(option, alias, type){
    option = "--" + option;
    alias = alias ? "-" + alias : null;
    if (type == "boolean" ){
        argv = _.without(argv, option, alias);
        return true;
    } else {
        var argPos = argv.indexOf(option),
            argValuePos = argPos + 1;
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