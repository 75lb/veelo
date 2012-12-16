#!/usr/bin/env node 

var marked = require("marked"),
	fs = require("fs");
	
console.log("index.html", marked(fs.readFileSync("README.md", "utf-8")));