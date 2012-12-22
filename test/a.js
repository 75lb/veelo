var _ = require("underscore");

function l(msg){ console.log(msg); }

var optionDefinitions = {
    version: {type: "boolean"},
    "output-dir": { type: "string", alias: "o" },
    other: {type: "string"},
    another: {type: "number"}
};

var argv = process.argv = [ "node", "/usr/bin/blah", "file.js", "--version", "-o", "./testdir", "file2.mov" ];
argv.shift(); argv.shift();

var output = {};

l(argv);
l("");

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
        l("boolean: " + option + ", " + alias);
        l(argv);
        argv = _.without(argv, option, alias);
        l(argv);
        l("");
        return true;
    } else {
        var argPos = argv.indexOf(option),
            argValuePos = argPos + 1;
            argValue = "";
        
        if (argPos > 0){
            if (argValuePos < argv.length){
                argValue = argv[argValuePos];
                l("option found: " + option)
                l(argv);
                argv.splice(argPos, 2);
                l(argv);
                l("");
            }
        }
        
        var aliasPos = argv.indexOf(alias),
            aliasValuePos = aliasPos + 1,
            aliasValue;
        
        if (aliasPos > 0){
            if (aliasValuePos < argv.length){
                l("alias found: " + alias);
                aliasValue = argv[aliasValuePos];
                l(argv);
                argv.splice(aliasPos, 2);
                l(argv);
                l("");
            }
        }
        
        return argValue || aliasValue;
    }
}

function argPassedIn(arg, alias){
    return argv.indexOf("--" + arg) > 0 || argv.indexOf("-" + alias) > 0;
}

// a.shift(); a.shift(); 
// 
// a.forEach(function(arg){
//     l(arg);
//     l(getOption(arg));
// });
// 
// function getOption(arg){
//     if (optionDefinitions[arg] !== undefined){
//         return arg;
//     } else {
//         _.each(optionDefinitions, function(val, option){
//             if (val.alias === arg){
//                 return key;
//             }
//         });
//     }
// }