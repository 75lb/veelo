var sinon = require("sinon"),
    util = require("util"),
    cp = require("child_process"),
    HandbrakeCli = require("../lib/handbrakeCli");

sinon.stub(cp, "spawn", function(){
    return {
        stdout: {
            setEncoding: function(){},
            on: function(){}
        },
        stderr: {
            setEncoding: function(){},
            on: function(){}
        },
        on: function(){}
    }
});

// console.log(util.inspect(cp.spawn, true, null, true));


var handbrakeCli = new HandbrakeCli();
handbrakeCli._inject({ cp: cp });

handbrakeCli.spawn({"preset-list": true}, true);

console.log(util.inspect(cp.spawn, true, null, true));

// handbrakeCli.on("data", function(data){
//     console.log(".");
// });
// 
// handbrakeCli.on("success", function(){
//     console.log("success");
//     console.log(util.inspect(cp.spawn.callCount, true, null, true));
// });
// 
// handbrakeCli.on("fail", function(){
//     console.log("fail");
//     console.log(util.inspect(cp.spawn.callCount, true, null, true));
// });