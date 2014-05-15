var test = require("tape"),
    encode = require("../lib/veelo");

// test("simple", function(t){
//     var files = [
//         "movies/one.mp4",
//         "movies/folder/three.mp4",
//         "five.avi"
//     ];
//     var options = {
//         preset: "Normal",
//         optimize: true,
//         ext: "mkv"
//     };
//     var commands = encode.buildCommands(files, options);
//     t.deepEqual(commands, [
//         { input: "movies/one.mp4", output: "movies/one.mkv", preset: "Normal", optimize: true },
//         { input: "movies/folder/three.mp4", output: "movies/folder/three.mkv", preset: "Normal", optimize: true },
//         { input: "five.avi", output: "five.mkv", preset: "Normal", optimize: true },
//     ]);
//     t.end();
// });
