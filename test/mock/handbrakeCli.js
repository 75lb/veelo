var EventEmitter = require("events").EventEmitter;

module.exports = HandbrakeCLI;

function HandbrakeCLI(){}
	
HandbrakeCLI.prototype = new EventEmitter();

HandbrakeCLI.prototype.spawn = function(processArgs, printOutput) {
    var self = this;
    function success(){
        self.emit("success");
    }
    setTimeout(success, 10);
};

HandbrakeCLI.prototype.exec = function(processArgString, done){
};