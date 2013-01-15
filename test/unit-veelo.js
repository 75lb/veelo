var shared = require("./shared"),
    path = require("path"),
    p = shared.path;

describe("veelo", function(){
    var inputFile = path.join(p.FIXTURE_DIR, p.VIDEO1);
    before(function(done){
        shared.setupSingleFileFixture(p.VIDEO1, done);
    });
    
    it("should correctly register 1 'valid' file in queue", function(){
        var veelo = require("../lib/veelo");
        // veelo.add(inputFile);
        // 
        // assert.strictEqual(veelo.stats.valid, 1);
    });
});