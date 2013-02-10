var Config = require("./config"),
    _ = require("underscore");

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
            config.forEach(function(conf){
                if (_configs[conf]){
                    _configs[name] = _configs[conf].clone();
                    console.log(name);
                    console.log(_configs[name]);
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
    this.get = function(name){
        return _configs[name];
    }

    /**
    @method getAllConfig
    @return {Array} All Config instances
    */

    this.apply = function(name, options){
        return options instanceof Config
            ? options
            : exports.get(name, options);
    }
}

module.exports = ConfigMaster;