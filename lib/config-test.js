var Config = require("./config2");
var shared = require("../test/shared");
var handbrake = require("./handbrake");

handbrake.run({ input: "test/fixture/clip1.mov" })
    .on("error", function(data){
        console.log(data);
    })
    .on("progress", function(progress){
        console.log(progress);
    })
    .on("complete", function(){
        console.log("complete");
    });
