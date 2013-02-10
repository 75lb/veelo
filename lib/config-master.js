/**
@class config-master
@module config-master
@constructor
*/
function ConfigMaster(){}

var _configs = {};

/**
@method add
@param {String} name
@param {Config} config The Config instance to add
*/
ConfigMaster.prototype.add = function(name, config){
    _configs[name] = config;
    return this;
}

/**
@method getConfig
@param {String} name
@return {Config} instanceOf Config
*/
ConfigMaster.prototype.get = function(name){
    return _configs[name];
}

/**
@method getAllConfig
@return {Array} All Config instances
*/

ConfigMaster.prototype.apply = function(name, options){
    return options instanceof Config
        ? options
        : exports.get(name, options);
}

module.exports = ConfigMaster;