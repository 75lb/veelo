Handbraker
=====
[![Build Status](https://travis-ci.org/75lb/handbraker.png)](https://travis-ci.org/75lb/handbraker)

Handbraker is a Video Library Optimisation tool. Consolidate your video library from a mixture of formats to a single, modern format which works everywhere ([H.264/MPEG-4 AVC](http://en.wikipedia.org/wiki/H.264/MPEG-4_AVC)). With a single command.

Handbraker, a scripting layer for the excellent [Handbrake](http://handbrake.fr), is built for this task. 

Works on __Windows__, __Linux__ and __Mac OSX__.

Synopsis
========
<pre><code>$ handbraker --recurse Boxing --exclude Tyson
[18:34:43] queue length: 158
[18:34:43] file types: .m4v(16) .avi(91) .wmv(2) .mp4(7) .mpg(23) .mkv(18) .m2ts(1)
[18:34:43] processing: <strong>Boxing/Eubank/Chris Eubank vs Nigel Benn.avi</strong>
Encoding: 0.71 % (70.07 fps, avg 78.30 fps, ETA 00h22m37s)</code></pre>

What is Handbrake? 
------------------
In their words: 

> HandBrake is an open-source, GPL-licensed, multiplatform, multithreaded video transcoder, available for MacOS X, Linux and Windows. It converts video from nearly any format to a handful of modern ones.

Install
=======
On all platforms, first ensure [node.js](http://nodejs.org) is installed. Visit [their download page](http://nodejs.org/download/) to find the correct installer for your system.

Then, at the command line enter: 

Windows & Mac OS X
------------------
	$ npm -g install handbraker
	
*some older Mac operating systems may require running the above with `sudo`* 

Ubuntu Linux
------------
	$ sudo npm -g install handbraker
	$ sudo npm -g run-script handbraker ubuntu-setup

(the second step above installs the [official Ubuntu Handbrake package](https://launchpad.net/~stebbins/+archive/handbrake-releases)).

Other Platforms
---------------
Other platform users must manually ensure `HandbrakeCLI` is installed on their PATH. Check the [official website](http://handbrake.fr/downloads2.php) to see if a release is available for your system. 

Update
------
If you already have handbraker installed, double-check you have the latest version: 

	$ sudo npm update -g handbraker

Usage
=====
A quick summary of the options can be displayed with the `--help` option:

	$ handbraker --help
	
	Usage: handbraker [options] [HandbrakeCLI options] [files]

	### Handbraker Options-------------------------------------------------------
	        --ext                  Output file extension. Choose 'mp4', 'm4v' or 'mkv' (default: m4v)
	        --archive              Archive the original file in a 'handbraker-originals' directory
	        --output-dir           Outputs to the specified directory
	        --preserve-dates       Preserve input's 'modified' and 'accessed' times on the output file
	        --recurse              Traverse into directories
	        --include              Regex include filter, for use with --recurse
	        --exclude              Regex exclude filter, for use with --recurse
	        --dry-run              Describe the outcome without performing the actual work
	        --embed-srt            If a matching .srt file exists, embed subtitles into the output video
	    -v, --verbose              Show detailed output
	    -h, --help                 Show this help
	        --hbhelp               Show this help plus all HandbrakeCLI options

Handbrake Options
-----------------
All non handbraker-specific options (those listed by `handbraker --help`) are passed directly to Handbrake. To view the [full range of Handbrake options](https://trac.handbrake.fr/wiki/CLIGuide), use:

	$ handbraker --hbhelp

Output Extension
----------------	
By default, handbraker will output media in a MP4 container using the ".m4v" file extension (plays well with all media players, particularly iTunes). If you prefer to output the MKV container format, use `--ext mkv`.

Archive your originals
----------------------
Handbraker does not delete or modify your original files, it leaves them where they are. If you would like to move your original files into a directory (convenient for archiving or discarding) set the `--archive` flag:

<pre><code>$ tree
.
├── rain.mov
└── video.mov	
	
$ handbraker --archive *.mov
[18:44:01] queue length: 2
[18:44:01] file types: .mov(2)
[18:44:01] processing <strong>rain.m4v</strong>
[18:44:39] processing <strong>video.m4v</strong>
[18:45:22] all encodes complete.
	
$ tree
.
├── handbraker-originals
│   ├── rain.mov
│   └── video.mov
├── rain.m4v
└── video.m4v</code></pre>

Output Directory
----------------
By default, handbraker outputs in the same directory as the input file. You can output to a sub-directory of each input file by passing `--output-dir <directory>`. For example,

<pre><code>$ tree
.
├── Jan
│   └── Manchester.mov
└── Feb
    └── Liverpool.mov
	
$ handbraker */*.mov --output-dir optimised
[18:44:01] queue length: 2
[18:44:01] file types: .mov(2)
[18:44:01] processing <strong>Jan/Manchester.mov</strong>
[18:44:39] processing <strong>Feb/Liverpool.mov</strong>
[18:45:22] all encodes complete.
	
$ tree
.
├── Jan
│   ├── Manchester.mov
│   └── optimised
│       └── Manchester.m4v
└── Feb
    ├── Liverpool.mov
    └── optimised
        └── Liverpool.m4v</code></pre>

If you specify an absolute `--output-dir` path, or a path beginning with `.` or `..`, output will be directed to a single, specific directory: 

<pre><code>$ tree
.
├── Jan
│   └── Manchester.mov
└── Feb
    └── Liverpool.mov
	
$ handbraker */*.mov --output-dir ./optimised
[18:44:01] queue length: 2
[18:44:01] file types: .mov(2)
[18:44:01] processing <strong>Jan/Manchester.mov</strong>
[18:44:39] processing <strong>Feb/Liverpool.mov</strong>
[18:45:22] all encodes complete.

$ tree
.
├── Jan
│   └── Manchester.mov
├── Feb
│   └── Liverpool.mov
└── optimised
    ├── Jan
    │   └── Manchester.m4v
    └── Feb
        └── Liverpool.m4v</code></pre>

Recurse
-------
By default, Handbraker ignore directories. If you wish to traverse into directories, processing the entire tree, use `--recurse`. 

With large directory trees, control which files are processed using `--include` and `--exclude` filters. Both these options accept Regular Expressions. For example, to only process `wmv` and `avi` files:

	$ handbraker --recurse Sport --include "\.wmv|\.avi"

Dry Run
-------
To see a report of what will or will not be processed, _without_ performing any work, pass `--dry-run`. This is a useful verification step before processing a large batch.

Embedding Subtitles
-------------------
If videos in your batch have external SRT subtitle files, you can embed them automatically by passing `--embed-srt`.

	$ handbraker Film/World/* --embed-srt

*Known Issue*: Handbrake does not accept SRT filenames containing a comma (the comma is a reserved delimiter character for the `--srt-file` option). 


Configuration
=============
The Handbraker configuration file is stored at `~/.handbraker` on Mac and Linux, `%USERPROFILE%\Application Data` on Windows XP and `%USERPROFILE%\AppData\Roaming` on Windows Vista and later. It must remain [valid JSON](http://jsonlint.com). 

The initial config file looks like this: 

	{
		"ignoreList": [".DS_Store"],
		"archiveDirectory": "handbraker-originals",
		"defaults": {
			"ext": "m4v",
			"preset": "Normal",
			"optimize": true,
			"preserve-dates": true,
			"srt-codeset": "UTF-8", 
			"srt-lang": "eng"
		}
	}

Defaults
--------
Handbraker ships with the "Normal" Handbrake preset set as default. This preset maintains the quality, dimensions and frame rate of the original. You can personalise your defaults in the config file. Options passed on the command line override their corresponding defaults.

Ignore List
-----------
Manage the list of files Handbraker should ignore, e.g. "Thumbs.db", ".DS_Store" etc.


More Examples
=============
To test the water, you want to encode a small sample of each video in the "Comedy" directory. Use the Handbrake options `--start-at` and `--stop-at`. For example, create samples beginning at the 60th second lasting for 120 seconds, outputing each into a `samples` sub-directory:

	$ handbraker Comedy/* --start-at duration:60 --stop-at duration:120 --output-dir samples
	
If sound quality is important, encode with a higher audio bitrate (e.g. 256kb/s):

	$ handbraker Concert.wmv --ab 256
	
Say your source media contains audio and subtitle tracks in several languages. You are interested in keeping just the Japanese audio and English subtitles. First scan the source media to find the ID numbers of the audio/subtitle tracks you wish to keep:

	$ handbraker -t 0 TokyoStory.mkv
	
In the output you'll see something like this: 

	+ audio tracks:
	  + 1, Russian (AC3) (2.0 ch) (iso639-2: rus), 48000Hz, 192000bps
	  + 2, Russian (AC3) (2.0 ch) (iso639-2: rus), 48000Hz, 192000bps
	  + 3, Japanese (AC3) (2.0 ch) (iso639-2: jpn), 48000Hz, 192000bps
	+ subtitle tracks:
	  + 1, Russian (iso639-2: rus) (Text)(UTF-8)
	  + 2, English (iso639-2: eng) (Text)(UTF-8)

So, we'll transcode taking audio track 3 and subtitle track 2:

	$ handbraker TokyoStory.mkv --audio 3 --subtitle 2
	
Use `--quality` to adjust the compression quality of the output. 20 is the optimum value, between 35 and 40 will give a conveniently small output file whilst remaining watchable - useful for email attachment:

	$ handbraker campaign.mov --quality 35

Presets
-------
Handbrake comes with a collection of [built-in presets](https://trac.handbrake.fr/wiki/BuiltInPresets), optimised for common scenarios and specific devices. View the list using: 

	$ handbraker --preset-list
	
To encode video optimised for iPod, you might use: 

	$ handbraker --preset iPod video1.mov video2.mov


Contributing
============
Patches welcome. There are a few features that would be nice to have, if you fancy implementing them: 

* a web frontend
* live queue management
* user-defined presets 

Please file bugs or feature requests on the [Issue List](https://github.com/75lb/handbraker/issues?state=open).

Developer install
-----------------
	$ git clone https://github.com/75lb/handbraker.git
	$ cd handbraker
	$ npm link
	
From there, the `handbraker` command will point to your checkout. If you make some changes, check everything still works by running the test suite: 

	$ npm test

DVD Copy Protection
===================
You can use handbraker to rip DVDs but it *does not crack DVD copy protection*. Use a specialised DVD ripper for this. 

License
=======
(c) 2012, Lloyd Brookes <75pound@gmail.com>
(MIT License)