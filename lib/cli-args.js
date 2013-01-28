/**
Module for parsing command-line arguments
@module config-master
@class cli-args
@static
*/

// module dependencies
var _ = require("underscore");

// privates
var _argv = process.argv;

/**
@method getArgs
@param {Config} optionDefinitions
@return {CommandLine} The data parsed from the command line
*/
exports.getArgs = function getArgs(optionDefinitions){
    _argv.splice(0, 2);

    var output = {
        args: {},
        files: [],
        invalid: []
    };

    // extract valid options
    _.each(optionDefinitions, function(def, option){
        var isAlias = false,
            aliassed = "";

        // alias
        if (typeof def === "string"){
            aliassed = def;
            def = optionDefinitions[def];
            isAlias = true;
        }

        if(argPassedIn(option, isAlias)){
            if (isAlias){
                output.args[aliassed] = pickArgValue(option, isAlias, def.type) 
            } else {
                output.args[option] = pickArgValue(option, isAlias, def.type) 
            }
        }
    });
    
    // remaining options are invalid
    output.invalid = _argv.filter(function(arg){return arg.substr(0,1) === "-"});
    
    // remaining items which are not options are files
    output.files = _argv.filter(function(arg){return arg.substr(0,1) !== "-"});
    return output;
};

exports._inject = function(a){
    _argv = a;
};

// private functions
function pickArgValue(option, isAlias, type){
    option = isAlias
        ? "-" + option
        : "--" + option;

    if (type === "boolean" ){
        _argv = _.without(_argv, option);
        return true;
    } else {
        var argPos = _argv.indexOf(option),
            argValuePos = argPos + 1,
            argValue = "";

        if (argPos > -1){
            if (argValuePos < _argv.length && _argv[argValuePos].substr(0,1) !== "-"){
                argValue = _argv[argValuePos];
            }
            _argv.splice(argPos, argValue ? 2 : 1);
        }
        
        return argValue || "";
    }
}

function argPassedIn(arg, isAlias){
    arg = isAlias
        ? "-" + arg
        : "--" + arg;
    return _argv.indexOf(arg) > -1;
}

/**
Encapsulates data parsed from the command line
@class CommandLine
@constructor
*/
function CommandLine(){
    /**
    Options
    @property options
    @type {Object}
    */
    this.options = {};
    /**
    Files
    @property files
    @type {Array}
    */
    this.files = [];
    /**
    Invalid options
    @property invalid
    @type {Array}
    */
    this.invalid = [];
    /**
    Command
    @property command
    @type {String}
    */
    this.command = "";    
}