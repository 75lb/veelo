V = require("./lib/veelo");
v = new V();

function log(msg){
    console.log(msg);
}

v.onMessage(log);
v.onHandbrakeOutput(log);

// v.add("/Users/Lloyd/Documents/Kunai/veelo/clip1.mov");
