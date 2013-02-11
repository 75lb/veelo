var Config = require("./config"),
    _ = require("underscore"),
    cli = require("./cli");

/**
@class config-master
@module config-master
@constructor
*/
function ConfigMaster(){
    var _configs = {};

    /**
    @method add
    @param {String} name
    @param {Config} config The Config instance to add
    */
    this.add = function(name, config){
        if (typeof config === "string"){
            if (_configs[config]){
                _configs[name] = _configs[config].clone();
            } else {
                throw new Error("config doesn't exist: " + config);
            }

        } else if (config instanceof Config) {
            _configs[name] = config;

        } else if (_.isArray(config)){
            var newConfig = new Config();
            config.forEach(function(conf){
                if (_configs[conf]){
                    newConfig.mixIn(_configs[conf]);
                    _configs[name] = newConfig;
                } else {
                    throw new Error("config doesn't exist: " + conf);
                }
            });
        }
        return this;
    }

    /**
    @method getConfig
    @param {String} name
    @return {Config} instanceOf Config
    */
    this.get = function(name, options){
        if (options){
            return this.get(name).set(options);
        } else {
            return _configs[name];
        }
    }
}

ConfigMaster.prototype.parseCommand = function(commandArray, options){
    command = commandArray.shift();
    var commandConfig = this.get(command, commandArrayToParse);
    
    return {
        command: command,
        config: commandConfig
    };
    
}
module.exports = ConfigMaster;