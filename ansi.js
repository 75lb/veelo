var cursor = require("ansi")(process.stdout),
    util = require("util");

process.on("SIGINT", function(){
    reset();
    process.exit();
});

function reset(){
    cursor.show();
    cursor.reset();
    cursor.goto(1, jobs.length + 1);
}

var jobs = [
    { name: "one", progress: 0 },
    { name: "two", progress: 0 },
    { name: "three", progress: 0 },
    { name: "four", progress: 0 },
    { name: "five", progress: 0 },
    { name: "one", progress: 0 },
    { name: "two", progress: 0 },
    { name: "three", progress: 0 },
    { name: "four", progress: 0 },
    { name: "one", progress: 0 },
    { name: "two", progress: 0 },
    { name: "three", progress: 0 },
    { name: "four", progress: 0 },
    { name: "one", progress: 0 },
    { name: "two", progress: 0 },
    { name: "three", progress: 0 },
    { name: "four", progress: 0 },
    { name: "one", progress: 0 },
    { name: "two", progress: 0 },
    { name: "three", progress: 0 },
    { name: "four", progress: 0 },
    { name: "one", progress: 0 },
    { name: "two", progress: 0 },
    { name: "three", progress: 0 },
    { name: "four", progress: 0 },
    { name: "one", progress: 0 },
    { name: "two", progress: 0 },
    { name: "three", progress: 0 },
    { name: "four", progress: 0 }
];

jobs.forEach(function(job){
    cursor.write(job.name + "\n");
})
 
jobs.forEach(function(job){
    cursor.up()
        .horizontalAbsolute(17)
        .write(job.progress.toString());
})

// cursor
//     .eraseData(2)
//     .hide();
// 
// for(var i = 0; i < jobs.length; i++){
//     var job = jobs[i];
//     while (15 - job.name.length > 0) {
//         job.name += " ";
//     }
//     cursor.goto(1, i+1)
//         .write(job.name + "\n")
//         .goto(17, i+1)
//         .write(job.progress.toString());
// }
// 
// setInterval(function(){
//     var i = Math.floor(Math.random() * jobs.length);
//     jobs[i].progress++;
//     cursor.goto(17, i+1)
//         .write(jobs[i].progress.toString());
// }, 100);

// var msgs = [];
// setInterval(function(){
//     msgs.push("whuuut");
//     cursor.goto(1, jobs.length + 1 + msgs.length)
//         .write(msgs[msgs.length-1] + "\n");
// }, 200)

// reset();
