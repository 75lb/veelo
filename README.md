<span id="veelo"></span>
Veelo
==========
[![Build Status](https://travis-ci.org/75lb/veelo.png)](https://travis-ci.org/75lb/veelo)

Requiring multiple media players and plugins to play video is annoying. Video refusing to play on expensive, modern TVs and mobile devices even more so. Well, you could optimise your video library - consolidate from a mixture of legacy and proprietary formats to a single, modern format which works everywhere ([H.264/MPEG-4 AVC](http://en.wikipedia.org/wiki/H.264/MPEG-4_AVC)).

Veelo, a command-line Video Library Optimisation tool built on top of the outstanding encoder Handbrake, was built for this task.

Works on __Windows__, __Linux__ and __Mac OSX__.

<span id="synopsis"></span>
Synopsis
--------
<pre><code>$ veelo --recurse Boxing --exclude Tyson
[18:34:43] queue length: 158
[18:34:43] file types: .m4v(16) .avi(91) .wmv(2) .mp4(7) .mpg(23) .mkv(18) .m2ts(1)
[18:34:43] processing: <strong>Boxing/Eubank/Chris Eubank vs Nigel Benn.avi</strong>
Encoding: 0.71 % (70.07 fps, avg 78.30 fps, ETA 00h22m37s)</code></pre>

<span id="install"></span>
Install
=======
First ensure [node.js](http://nodejs.org) is installed. Visit [their download page](http://nodejs.org/download/) to find the correct installer for your system.

Then, at the command line enter:

<span id="install-winmac"></span>
Windows & Mac OS X
------------------
    $ npm -g install veelo
    
*some older Mac operating systems may require running the above with `sudo`* 

<span id="install-ubuntu"></span>
Ubuntu Linux
------------
    $ sudo npm -g install veelo
    $ sudo npm -g run-script veelo ubuntu-setup

(the second step above installs the [official Ubuntu Handbrake package](https://launchpad.net/~stebbins/+archive/handbrake-releases)).

<span id="install-other"></span>
Other Platforms
---------------
Other platform users must manually ensure `HandbrakeCLI` is installed on their PATH. Check the [official website](http://handbrake.fr/downloads2.php) to see if a release is available for your system. 

<span id="update"></span>
Update
------
If you already have veelo installed, double-check you have the latest version: 

    $ sudo npm update -g veelo

<span id="usage"></span>
Usage
=====
A quick summary of the options can be displayed with the `--help` option:

    $ veelo --help
    
    Usage: veelo [options] [HandbrakeCLI options] [files]

    ### Veelo Options-------------------------------------------------------
            --ext <string>         Output file extension (implicitly sets container format). Choose 'mp4', 'm4v' or 'mkv'.
            --archive              Archive the original file to a specified directory (default: 'veelo-originals')
            --output-dir <string>  Outputs to the specified directory
            --preserve-dates       Preserve input's 'modified' and 'accessed' times on the output file
            --recurse              Traverse into directories
            --include <regex>      Regex include filter, for use with --recurse
            --exclude <regex>      Regex exclude filter, for use with --recurse
            --dry-run              Describe the outcome without performing the actual work
            --embed-srt            If a matching .srt file exists, embed subtitles into the output video
        -v, --verbose              Show detailed output
            --version              Show version info
        -h, --help                 Show this help
            --hbhelp               Show this help plus all HandbrakeCLI options

<span id="usage-handbrake"></span>
Specifiy HandbrakeCLI Options
--------------------------
If you are fimilar with Handbrake, and/or want more control over the encoder settings, run this command to view the [full range of Handbrake options](https://trac.handbrake.fr/wiki/CLIGuide):

    $ veelo --hbhelp
 
When specified, these options are passed directly to the underlying Handbrake encoder. The following options set a [constant quality](https://trac.handbrake.fr/wiki/ConstantQuality) of 25 with 64kb/s, mono audio: 

    $ veelo --quality 25 --ab 64 --mixdown mono video.mov

<span id="usage-ext"></span>
Set Output File Extension
-------------------------
By default, veelo will output media in a MP4 container using the ".m4v" file extension (plays well with all media players, particularly iTunes/Quicktime). If you prefer to output the MKV container format, use `--ext mkv`.

<span id="usage-archive"></span>
Archive your originals
----------------------
Veelo does not delete or modify your original files, it leaves them where they are. After processing, if you would like the original files moved into a directory convenient for archiving or discarding set the `--archive` flag. For example, the following files: 

<pre><code>.
├── rain.mov
└── video.mov</code></pre>

after processing would be arranged like so: 
    
<pre><code>.
├── veelo-originals
│   ├── rain.mov
│   └── video.mov
├── rain.m4v
└── video.m4v</code></pre>

<span id="usage-output-dir"></span>
Specify an Output Directory
---------------------------
By default, veelo outputs in the same directory as the input file. You can output to a sub-directory of each input file by passing `--output-dir <directory>`. For example, with this directory structure:

<pre><code>.
├── Jan
│   └── Manchester.mov
└── Feb
    └── Liverpool.mov</code></pre>
    
running `$ veelo */*.mov --output-dir optimised` would output: 
    
<pre><code>.
├── Jan
│   ├── Manchester.mov
│   └── optimised
│       └── Manchester.m4v
└── Feb
    ├── Liverpool.mov
    └── optimised
        └── Liverpool.m4v</code></pre>

If you specify an absolute path, or a path beginning with "." or "..", output will be directed to a single, specific directory. So, running `$ veelo */*.mov --output-dir ./optimised` would output: 

<pre><code>.
├── Jan
│   └── Manchester.mov
├── Feb
│   └── Liverpool.mov
└── optimised
    ├── Jan
    │   └── Manchester.m4v
    └── Feb
        └── Liverpool.m4v</code></pre>

<span id="usage-preserve"></span>
Preserve Dates
--------------
If the original file dates are important to you (quite often the case with home video), set `--preserve-dates`. Output will preserve the dates of the input. Initially set by defualt.

<span id="usage-recurse"></span>
Recurse
-------
By default, Veelo ignore directories. If you wish to traverse into directories processing the entire tree, use `--recurse`. 

With large directory trees, control which files are processed using `--include` and `--exclude` filters. Both these options accept Regular Expressions. For example, to only process `wmv` and `avi` files:

    $ veelo --recurse Sport --include "\.wmv|\.avi"

<span id="usage-dry-run"></span>
Dry Run
-------
To see a report of what will or will not be processed, _without_ performing any work, pass `--dry-run`. This is a useful verification step before processing a large batch.

<span id="usage-embed-srt"></span>
Embedding Subtitles
-------------------
If videos in your batch have external SRT subtitle files, you can embed them automatically by passing `--embed-srt`.

    $ veelo Film/World/* --embed-srt

*Known Issue*: Handbrake does not accept SRT filenames containing a comma (the comma is a reserved delimiter character for the `--srt-file` option). 

<span id="config"></span>
Configuration
=============
The Veelo configuration file is stored at `~/.veelo.json` on Mac and Linux, `%USERPROFILE%\Application Data` on Windows XP and `%USERPROFILE%\AppData\Roaming` on Windows Vista and later. It must remain [valid JSON](http://jsonlint.com). 

The initial config file looks like this: 

    {
        "defaults": {
            "handbrake": {
                "preset": "Normal",
                "optimize": true,
                "srt-codeset": "UTF-8", 
                "srt-lang": "eng"
            },
            "veelo": {
                "ext": "m4v",
                "preserve-dates": true,
                "ignoreList": [".DS_Store"],
                "archiveDirectory": "veelo-originals"
            }
        }
    }

<span id="config-defaults"></span>
Defaults
--------
Veelo ships with the "Normal" Handbrake preset set as default. This preset maintains the quality, dimensions and frame rate of the original. You can personalise your defaults in the config file. Options passed on the command line override their corresponding defaults.

Ignore List
-----------
Manage the list of files Veelo should ignore, e.g. "Thumbs.db", ".DS_Store" etc.

<span id="examples"></span>
More Examples
=============

<span id="examples-samples"></span>
Make Samples
------------
To test the water, you want to encode a small sample of each video in the "Comedy" directory. Use the Handbrake options `--start-at` and `--stop-at`. For example, create samples beginning at the 180th second lasting for 10 seconds, outputing each into a `samples` sub-directory:

    $ veelo Comedy/* --start-at duration:180 --stop-at duration:10 --output-dir samples

<span id="examples-ab"></span>
Higher Audio Quality
--------------------    
If sound quality is important, encode with a higher audio bitrate (e.g. 256kb/s):

    $ veelo Concert.wmv --ab 256

<span id="examples-audio-sub"></span>
Cherry-picking Audio and Subtitle tracks
----------------------------------------
Say your source media contains audio and subtitle tracks in several languages. You are interested in keeping just the Japanese audio and English subtitles. First scan the source media to find the ID numbers of the audio/subtitle tracks you wish to keep:

    $ veelo --scan TokyoStory.mkv
    
In the output you'll see something like this: 

    + audio tracks:
      + 1, Russian (AC3) (2.0 ch) (iso639-2: rus), 48000Hz, 192000bps
      + 2, Russian (AC3) (2.0 ch) (iso639-2: rus), 48000Hz, 192000bps
      + 3, Japanese (AC3) (2.0 ch) (iso639-2: jpn), 48000Hz, 192000bps
    + subtitle tracks:
      + 1, Russian (iso639-2: rus) (Text)(UTF-8)
      + 2, English (iso639-2: eng) (Text)(UTF-8)

So, we'll transcode taking audio track 3 and subtitle track 2:

    $ veelo TokyoStory.mkv --audio 3 --subtitle 2

<span id="examples-quality"></span>
Video Compression Quality
-------------------------
Use `--quality` to adjust the compression quality of the output. 20 is the optimum value, between 35 and 40 will give a conveniently small output file whilst remaining watchable - useful for email attachment:

    $ veelo campaign.mov --quality 35

<span id="examples-presets"></span>
Presets
-------
Handbrake comes with a collection of [built-in presets](https://trac.handbrake.fr/wiki/BuiltInPresets), optimised for common scenarios and specific devices. View the list using: 

    $ veelo --preset-list
    
To encode video optimised for iPod, you might use: 

    $ veelo --preset iPod video1.mov video2.mov

<span id="contrib"></span>
Contributing
============
Patches welcome. Feel free to implement: 

* a web frontend
* live queue management
* user-defined presets 

<span id="contrib-bugs"></span>
Bugs
----
Please file bugs or feature requests on the [Issue List](https://github.com/75lb/veelo/issues?state=open).

<span id="contrib-dev"></span>
Developer install
-----------------
    $ git clone https://github.com/75lb/veelo.git
    $ cd veelo
    $ npm link
    
From there, the `veelo` command will point to your checkout. If you make some changes, check everything still works by running the test suite: 

    $ npm test

<span id="notes"></span>
Notes
=====

<span id="notes-dvd"></span>
DVD Copy Protection
-------------------
You can use veelo to rip DVDs but it *does not crack DVD copy protection*. Use a specialised DVD ripper for this. 

<span id="license"></span>
License
-------
(c) 2012, Lloyd Brookes <75pound@gmail.com>
(MIT License)