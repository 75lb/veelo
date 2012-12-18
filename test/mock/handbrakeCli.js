var EventEmitter = require("events").EventEmitter;

module.exports = HandbrakeCLI;

function HandbrakeCLI(){}
	
HandbrakeCLI.prototype = new EventEmitter();

HandbrakeCLI.prototype.spawn = function(processArgs, printOutput) {
    console.log("spawning mock shit, yo");
    var self = this;
    function success(){
        console.log("mock shit success");
        self.emit("success");
    }
    setTimeout(success, 100);
};

HandbrakeCLI.prototype.exec = function(processArgString, done){
};