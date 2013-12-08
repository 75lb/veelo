"use strict";
/**
Synopsis:

    var veelo = require("veelo");
    
    veelo.encode({ files: ["Oh ffs.wmv", "Doc off.avi"], preset: "Normal" })
         .on("queue-starting", function(queue){
             console.log("%d encodes queued.", queue.jobs.length );
         })
         .on("job-progress", function(job, progress){
             console.log("%d% complete", progress.percentComplete);
         })
         .on("queue-complete", function(queue){
             console.log("%d encodes complete: %d success, %d fail. ");
         });
    
@class veelo
@static
*/

/**
Manage user defaults (stored in `~/.veelo.json`)
@method defaults
@param {Object} options 
@param {Object} options.add
@param {Object} options.remove
@chainable
@example
    veelo.defaults
        .add("srt-lang", "English")
        .remove("preset", "Android")
        .list();
*/
// exports.defaults = function(options){
//     var config = crudThing.clone().set(options);
// };

/**
Preset Management
@method preset
@chainable
@example
    veelo.preset.set("my phone", { rotate: 3, quality: 25 });
    veelo.preset.remove("preset");
    veelo.preset.list();
*/
exports.preset = function(){
};

/**
@method collage
@return {Queue}
@example
    var queue = veelo.collage({ files: ["Films"], recurse: true, clipLength: 2 });
*/
exports.collage = function(){};
