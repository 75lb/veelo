#!/usr/bin/env node 

var marked = require("marked"),
    fs = require("fs");
	
var markup = marked(fs.readFileSync("README.md", "utf-8")),
    index = fs.readFileSync("index.html", "utf-8");

var match = index.match(/<article id="documentation">[\s\S]*<\/article>/);

if (match){
  fs.writeFileSync("index.html", index.replace(
    match[0], 
    '<article id="documentation">' + markup + '</article>'
  ));
}
