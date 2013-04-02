var nature = require("nature"),
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    handbrake = require("handbrake-js"),
    _ = require("underscore");
    
var Thing = nature.Thing;

exports.FileList = FileList;
exports.CommonOptionSet = CommonOptionSet;
exports.CrudOptionSet = CrudOptionSet;
exports.EncodeOptionSet = EncodeOptionSet;

function FileList(){
    Thing.call(this);
    this.define({
            name: "files", 
            type: Array,
            required: true,
            defaultOption: true,
            valueTest: function(files){
                var self = this;
                return files.every(function(file){
                    if (fs.existsSync(file)){
                        return true;
                    } else {
                        self.addValidationMessage("file doesn't exist: " + file);
                        return false;
                    }
                });
            }
        })
        .define({ name: "recurse", type: "boolean" })
        .define({ name: "include", type: RegExp, typeFailMsg: "please pass a valid regular expression" })
        .define({ name: "exclude", type: RegExp, typeFailMsg: "please pass a valid regular expression" })
        .define({ name: "ignoreList", type: Array });
}
util.inherits(FileList, Thing);

function CommonOptionSet(){
    Thing.call(this);
    this.define({ name: "dry-run", type: "boolean" });
}
util.inherits(CommonOptionSet, Thing);

function CrudOptionSet(){
    Thing.call(this);
    this.define({ name: "add", type: "string", alias: "a" })
        .define({ name: "value", type: "string", defaultOption: true })
        .define({ name: "remove", type: "string", alias: "r" })
        .define({ name: "set", type: "string" })
        .define({ name: "list", type: "boolean" });
}
util.inherits(CrudOptionSet, Thing);

function EncodeOptionSet(){
    Thing.call(this);
    this.define({ name: "ext", type: "string", valid: /^(mp4|m4v|mkv)$/, default: "m4v" })
        .define({ name: "archive", type: "boolean" })
        .define({ name: "archive-directory", type: "string", default: "veelo-originals" })
        .define({ name: "output-dir", type: "string", valid: function(dir){
            var sameAsArchiveDir = path.resolve(dir) === path.resolve(this.config.get("archive-directory"));
            if (sameAsArchiveDir){
                this.addValidationMessage("Archive and Output directories must be different");
            }
            return !sameAsArchiveDir;
        }})
        .define({ name: "embed-srt", type: "boolean" })
        .define({ name: "preserve-dates", type: "boolean", alias: "p" })
        .define({ name: "user-defined-presets", type: "object" })
        .mixIn(new FileList())
        .mixIn(handbrake.run.config.where({
            name: { $ne: ["preset-list", "help", "scan", "title" ] }
        }), "handbrake")
        .set("preset", "Normal")
        .set("optimize", true)
        .mixIn(new CommonOptionSet());
}
util.inherits(EncodeOptionSet, Thing);