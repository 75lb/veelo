/**
Module for parsing command-line arguments
@module config-master
@class cli
@static
*/

// module dependencies
var EventEmitter = require("events").EventEmitter,
    shared = require("../test/shared"),
    _ = require("underscore");

// privates
var _argv = process.argv;

/**
@method parse
@param {Config|Array} optionDefinitions An instance on Config defining the available options. Or an Array of Commands and their options. 
@return {CommandLine} The data parsed from the command line
@example
Pass a Config instance to define the options your app supports

    var cli = require("./lib/cli");

    var cliValues = cli.parse(new Config()
        .option("recursive", { type: "boolean", alias: "r" })
        .option("sort", { type: "string" })
    );
    
With the above example, the command line of 

    $ node myapp.js -r file1.mov file2.jpg file3.pdf --sort "date"
    
would return

    {
        files: [ "file1.mov", "file2.jpg", "file3.pdf" ],
        options: {
            recursive: true,
            sort: "date"
        },
        invalid: []
    }

@example
Pass an Array to define multiple commands, and the config options each supports.

    var cli = require("./lib/cli");
    
    var cliValues = cli.parse([
        { 
            command: "help" 
        },
        { 
            command: "list", 
            config: new Config()
                .option("recursive", { type: "boolean", alias: "r" })
                .option("sort", { type: "string" })
        },
        { 
            command: "delete", 
            config: new Config()
                .option("force", { type: "boolean", alias: "f" })
        }
    ]);
    
With the above code, the command 

    $ node app.js help 
    
would return:

    {
        command: "help"
    }
    
The command 

    $ node app.js list -r --sort date some_directory

would return:

    {
        command: "list",
        files: ["some_directory"],
        options: {
            recursive: true,
            sort: "date"
        }
        invalid: []
    }
*/
exports.parse = function(arg){
    var output = new CommandLine();

    // abandon first two cli args
    _argv.splice(0, 2);

    // user passed Config instance
    if(typeof arg === "object" && !Array.isArray(arg)){
        
    
    // user passed Array of commands
    } else {
        var commandArray = arg,
            availableCommands = commandArray.map(function(cmd){ return cmd.command; });
        
        // test which commands were specified on cli
        var commandsPassed = _.intersection(availableCommands, _argv);
        if(commandsPassed.length > 1){
            throw new Error("you can only specifiy one command");
        }
        if(commandsPassed.length == 0){
            throw new Error("you must specify a valid command");
        }
        var commandPassed = commandsPassed[0];

        _argv = _.without(_argv, commandPassed);

        var optionDefinitions = commandArray.filter(function(cmd){
            return cmd.command == commandPassed;
        })[0].config._definitions;
        
        output.command = commandPassed;
        
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
                    output.options[aliassed] = pickArgValue(option, isAlias, def.type) 
                } else {
                    output.options[option] = pickArgValue(option, isAlias, def.type) 
                }
            }
        });
    
        // remaining options are invalid
        var invalid = _argv.filter(function(arg){return arg.substr(0,1) === "-"});
    
        // remaining items which are not options are files
        output.files = _argv.filter(function(arg){return arg.substr(0,1) !== "-"});
        shared.log(output);
        return output;
        
    }
};

exports._inject = function(testArgv){
    _argv = testArgv;
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
    Throws on
    
    * invalid options passed
    * multiple commands passed
    @event error
    @param {String} message Error message
    */
    var error = "error";
    
    /**
    Option name/value hash
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
    Command
    @property command
    @type {String}
    */
    this.command = "";    
}
CommandLine.prototype = new EventEmitter();