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