/**
@class config-master
@module config-master
@static
*/

var _configs = {};

/**
@method add
@param {String} name
@param {Config} config The Config instance to add
*/
exports.add = function(name, config){
    _configs[name] = config;
}

/**
@method getConfig
@param {String} name
@return {Config} instanceOf Config
*/
exports.get = function(name){
    return _configs[name];
}

/**
@method getAllConfig
@return {Array} All Config instances
*/

