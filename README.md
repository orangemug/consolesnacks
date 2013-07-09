# consolesnacks
This module is a plugin for [browserify](http://browserify.org) to parse the AST so that you can remove that pesky `console.*`. It can also be run standalone.


## Configuration
There are 3 ways to configure it

 * environment variables
 * `.consolesnacksrc` file
 * via an object (only in standalone mode)

To configure via the `.consolesnacksrc` file, place a file of that name in the root of your project. **NOTE** consolesnacks will scan up the directory tree until it finds a file of that name.

This file must have the following structure

    {
      "dev": {
        "disable": true
      },
      "staging": {
        "loglevel": "warn",
        "method": [
          "time",
          "profile"
        ]
      },
      "default": {}
    }

Where the object keys is the current environment as dictated by one of the following enviroment variables in order of precidence

 * `CONSOLESNACKS_ENV`
 * `ENV`

The `loglevel` indicates the level at which you want to keep the logging methods, via the following order

 * dev
 * log
 * info
 * warn
 * error

For example a log level of *warn* would keep all *warn* and *error* calls.

The `method` array states all other methods on the `console` object that you want to keep, note this includes the associated "End" methods. For example if you specify `time` then the following methods will be included

    console.time("consolesnacks is awesome!");
    console.timeEnd("consolesnacks is awesome!");

Specifying `{"disable": true}` prevent any `console` methods being removed.

All this configuration is also available via the setting environment variables directly. The format is as follows

    CONSOLESNACKS_LOGLEVEL    = "info"
    CONSOLESNACKS_METHOD_TIME = "true"
    CONSOLESNACKS_DISABLE     = "true"

Please note the environment variables take predicednce over the `.consolesnacksrc` file.


## Usage
You can run the app via browserify either via the command line

    browserify -t consolesnacks example/main.js > bundle.js

Or via javascript

    var browserify = require('browserify');
    var fs = require('fs');

    var b = browserify('example/main.js');
    b.transform('consolesnacks');

    b.bundle().pipe(fs.createWriteStream('bundle.js'));

You can also run it directly, where `tr` is a through stream

    var consolesnacks = require("consolesnacks");
    consolesnacks("./file/path", configObject);

Or via the commandline if install globally (`npm install -g`)

    consolesnacks file


## Install
Just include the git url in your `package.json` or install via

    npm install "git://github.com/orangemug/consolesnacks.git"

Or it you want the command line app

    npm install -g "git://github.com/orangemug/consolesnacks.git"


# License
MIT
