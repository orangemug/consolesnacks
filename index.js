var path = require('path');

var through = require('through');
var falafel = require('falafel');
var unparse = require('escodegen').generate;

var LOG_LEVELS = [
  "dev",
  "log",
  "info",
  "warn",
  "error"
];

module.exports = function (file) {
  if (/\.json$/.test(file)) return through();
  var data = '';
  var fsNames = {};
  var vars = [ '__filename', '__dirname' ];
  var dirname = path.dirname(file);
  var pending = 0;
  
  var tr = through(write, end);
  return tr;
  
  function write (buf) { data += buf }
  function end () {
    var output, self = this;
    getConfig(function(config) {
      try { output = parse(config) }
      catch (err) {
        self.emit('error', new Error(
          err.toString().replace('Error: ', '') + ' (' + file + ')')
        );
      }

      finish(output);
    });
  }
  
  function finish (output) {
    tr.queue(String(output));
    tr.queue(null);
  }

  function isDirectory(dirpath) {
    // TODO
    return false;
  }

  function isFile(filepath) {
    // TODO
    return false;
  }

  function parseConfig(filepath) {
    // TODO: Shouldn't be the sync method
  }

  function getConfigFromEnv(ret) {
    var env = process.env;
    // Get env vairables
    for(var k in env) {
      if(env.hasOwnProperty(k)) {
        if(k.match(/^CONSOLESNACKS_METHOD_(.*)$/)) {
          ret.method[RegExp.$1] = env[k];
        } else if(k === "CONSOLESNACKS_LOGLEVEL") {
          ret.loglevel = env[k];
        } else if(k === "CONSOLESNACKS_DISABLE") {
          ret.disable = env[k];
        }
      }
    }

    return ret;
  }

  function getConfigFromRcFile(ret, done) {
    // Find `.consolesnacksrc` config file by searching up the tree.
    var foundFile = false;
    var maxIteration = 100;
    var basepath = process.cwd();
    while(basepath !== "/") {
      if(maxIteration-- < 0) return;

      if( isDirectory(basepath) ) {
        var rcpath = path.join(basepath, ".consolesnacksrc");
        if( fs.exists(rcpath) && isFile(rcpath) ) {
          foundFile = true;
          var obj = parseConfig(rcpath, done)
          fs.readFile(filepath, function(err, data) {
            // TODO: HERE!!!
            done(err, JSON.parse(data));
          });
          _.extends(ret, obj[targetEnv]);
          return;
        }
      }

      basepath = path.dirname(basepath);
    }

    if(!foundFile) {
      done({})
    }
  }

  function getConfig(done) {
    var env = process.env;
    var targetEnv = (env["ENV"] === undefined ? env["ENV"] : "default");

    // Set initial state
    var ret = {
      method:   [],
      disable:  false,
      loglevel: undefined
    };

    getConfigFromEnv(ret);

    // TODO

    done(ret);
  }
  
  function parse (config) {
    var output = falafel(data, function (node) {
      // Are we a `console.*` node
      if (
           node.callee
        && node.callee.parent
        && node.callee.parent.type === "CallExpression"
        && node.callee.type        === 'MemberExpression'
        && node.callee.object.type === 'Identifier'
        && node.callee.object.name === "console"
        && node.callee.property.type.match(/Identifier|Literal/)
      ) {
        // Get the core method name
        var methodName;
        if(node.callee.property.type === "Literal") {
          methodName = node.callee.property.value.replace(/End$/, "");
        } else {
          methodName = node.callee.property.name.replace(/End$/, "");
        }

        var include = (config.disable === true || config.method[methodName.toUpperCase()]);

        // Check log levels
        if(config.loglevel && LOG_LEVELS.indexOf(methodName) > -1) {
          var methodIndex = LOG_LEVELS.indexOf(methodName);
          var levelIndex  = LOG_LEVELS.indexOf(config.loglevel);

          if(levelIndex > -1 && methodIndex >= levelIndex) {
            include = true;
          } else {
            include = false;
          }
        }

        if(!include) {
          // Leave behind a ";" just to be safe
          node.update("0");
        }
      }
    });

    return output;
  }
};
