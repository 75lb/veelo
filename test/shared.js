var fs = require("fs-extra"),
    path = require("path"),
    util = require("util");

var p = exports.path = {
    VIDEO1: "clip1.mov", VIDEO1_M4V: "clip1.m4v",
    VIDEO1_MKV: "clip1.mkv", VIDEO1_MP4: "clip1.mp4",
    VIDEO1_SRT: "clip1.srt",
    VIDEO2: "music.m4v", VIDEO2_M4V: "music_.m4v",
    VIDEO2_MKV: "music.mkv", VIDEO2_MP4: "music.mp4",
    MEDIUM: "medium.m4v", MEDIUM_M4V: "medium_.m4v",
    ASSETS_DIR: path.join(__dirname, "assets"),
    FIXTURE_DIR: path.resolve(__dirname, "fixture"),
    ORIGINALS_DIR: "veelo-originals"
};
p.SUB_DIR = path.join(p.FIXTURE_DIR, "subdir");
p.SUB_DIR2 = path.join(p.SUB_DIR, "subdir2");

exports.log = function log(msg){
    console.log(util.inspect(msg, true, null, true));
};

exports.clearFixture = function clearFixture(){
    fs.removeSync(p.FIXTURE_DIR);
    fs.mkdirsSync(p.SUB_DIR2);
};

exports.setupSingleFileFixture = function setupSingleFileFixture(file, done){
    exports.clearFixture();
    fs.copy(path.join(p.ASSETS_DIR, file), path.join(p.FIXTURE_DIR, file), function(err){
        if (err) throw err;
        done();
    });
};
