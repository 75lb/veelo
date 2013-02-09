var fs = require("fs"),
    path = require("path"),
    os = require("os"),
    fse = require("fs-extra");
    
exports.Timer = function(){
    this.startTime = 0;
    this.endTime = 0;
    this.duration = 0;
    this.start = function(){
        this.startTime = Date.now();
        return this;
    }
    this.stop = function(){
        this.endTime = Date.now();
        this.duration = this.endTime - this.startTime;
        return this;
    }
};

exports.moveFile = function(from, to, safe){
    if (from && to){
        safe = typeof safe === "undefined" ? true : safe;
        var toDir = path.dirname(to);
        if (!fs.existsSync(toDir)){
            fse.mkdirsSync(toDir);
        }
        to = safe 
            ? exports.getSafePath(to)
            : to;
        fs.renameSync(from, to);
        
        // if(_jobConfig.get("preserve-dates")){
        //     var inputFileStats = fs.statSync(_jobConfig.get("archive") ? self.path.archive : self.path.input);
        //     fs.utimesSync(self.path.output, inputFileStats.atime, inputFileStats.mtime);
        // }
        
    } else {
        throw new Error("moveFile: must supply both `from` AND `to` path");
    }
};

exports.deleteFile = function(file){
    if (fs.existsSync(file)){
        fs.unlink(file);
    }
};

exports.getSafePath = function(path){
    if (fs.existsSync(path)){
        return exports.getSafePath(path.replace(/\.(\w+)$/, "_.$1"));
    } else {
        return path;
    }
};

exports.getTempFilePath = function(baseFileName){
    return path.join(os.tmpDir(), path.basename(baseFileName));
};

exports.getSubDirPath = function(file, subDirName){
    if (subDirName){
        return path.join(
            path.dirname(file), 
            subDirName, 
            path.basename(file)
        );
    } else {
        throw new Error("getSubDirName: must supply a sub directory path");
    }
}

exports.replaceFileExtension = function(file, ext){
    return file.replace(/\.\w+$/, "." + ext);
};

exports.getOutputPath = function(file, outputDir){
    if(outputDir && file){
        outputDir = outputDir.trim();
        // specific path specified
        if (/^\.\//.test(outputDir) || /^\//.test(outputDir) || /\.\.\//.test(outputDir)){
            return path.join(outputDir, file);
            
        // else return subdir path of input file
        } else {
            return exports.getSubDirPath(file, outputDir);
        }
    }
}

exports.typeof = function(){}