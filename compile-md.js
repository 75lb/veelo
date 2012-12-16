#!/usr/bin/env node 

var marked = require("marked"),
    fs = require("fs");
	
var markup = marked(fs.readFileSync("README.md", "utf-8")),
    indexHtml = fs.readFileSync("index-tmpl.html", "utf-8");

console.log(indexHtml.replace(
  '<article id="documentation"></article>', 
  '<article id="documentation">' + markup + '</article>'
));