"use strict";
var fs = require("fs"),
    path = require("path"),
    _ = require("underscore"),
    Job = require("work").Job,
    general = require("more-fs"),
    thing = require("./thing"),
    job = require("./job"),
    l = console.log; /* exported l */

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
Encode a file or files
@method encode
@param {Object | Thing} options
@return Queue
@example
    encode({ files: ["Rawhide 1.wmv", "Rawhide 2.wmv"], preset: "Normal" })
        .on("job-progress", function(job, progress){
            console.log(progress.percentComplete);
        });
*/
module.exports = function(options){
    var config = new thing.EncodeOptionSet().set(options),
        queue = new Job({ name: "Encode Queue" });

    function distinctExts(queue){
        var output = {};
        queue.children.forEach(function(job){
            var ext = path.extname(job.data.file).toLowerCase();
            if (output[ext]){
                output[ext]++;
            } else {
                output[ext] = 1;
            }
        });
        return output;
    }

    process.nextTick(function(){
        if (!config.valid){
            console.error(config.validationMessages);
            throw new Error("invalid options");
        } else {
            var files = config.get("files");
            if (config.recurse){
                files = general.expandFileList(files, config.get("include"), config.get("exclude"));
            }
            files.forEach(function(file){
                // also check ignore list
                var fileStats = fs.statSync(file);
                if (fileStats.isFile()){
                    var outputBaseName = general.replaceFileExtension(file, config.get("ext"));
                    var path = {
                        input: file,
                        working: general.getTempFilePath(outputBaseName),
                        archive: config.get("archive")
                            ? general.getSubDirPath(file, config.get("archive-directory"))
                            : "",
                        output: config.hasValue("output-dir")
                            ? getOutputPath(config.get("output-dir"), outputBaseName)
                            : outputBaseName
                    };

                    // Encode Job
                    var encodeJob = new job.EncodeJob(config, path);

                    // onfail / terminate
                    encodeJob.add(new job.DeleteJob("Undo", path.working), "failed");
                    encodeJob.add(new job.DeleteJob("Undo", path.working), "terminated");

                    // onSuccess
                    // Archive
                    if (path.archive){
                        var archiveJob = new job.MoveJob("Archive to", path.input, path.archive);
                        encodeJob.add(archiveJob, "successful");
                    }

                    // Place Output
                    var saveJob = new job.MoveJob("Save to", path.working, path.output);
                    encodeJob.add(saveJob, "successful");

                    // Preserve Dates
                    if(config.get("preserve-dates")){
                        saveJob.add({
                            name : "Preserve Dates to",
                            commandSync: function(){
                                general.preserveDates(fileStats, this.parent.parent.returnValue);
                            },
                            data: { file: path.output }
                        }, "successful");
                    }
                    queue.add(encodeJob);
                }
            });

            if (config.get("dry-run")){
                queue.inform(distinctExts(queue));
                queue.inform("The following input files will be processed\n");

                queue.jobs.forEach(function(job){
                    queue.inform(job.data.path.input);
                });

                queue.inform("\noutput will land in these directories:");
                var distinctDirs = [];
                queue.jobs.forEach(function(job){
                    distinctDirs.push(path.dirname(job.data.path.output));
                });
                distinctDirs = _.uniq(distinctDirs);
                distinctDirs.forEach(function(dir){
                    queue.inform(dir);
                });

                if (config.get("archive")){
                    queue.inform("\nThe input files will be archived to these directories: ");
                    distinctDirs = [];
                    queue.jobs.forEach(function(job){
                        distinctDirs.push(path.dirname(job.data.path.archive));
                    });
                    distinctDirs = _.uniq(distinctDirs);
                    distinctDirs.forEach(function(dir){
                        queue.inform(dir);
                    });
                }
            } else {
                queue.run();
            }
        }
    });

    return queue;
};

function getOutputPath(outputDir, file){
    var outputPath = "";
    outputDir = outputDir.trim();

    // specific path specified
    if (/^\.\//.test(outputDir) || /^\//.test(outputDir) || /\.\.\//.test(outputDir)){
        outputPath = path.join(outputDir, file);

    // subdir path relative of input file
    } else {
        outputPath = general.getSubDirPath(file, outputDir);
    }
    return outputPath;
}
