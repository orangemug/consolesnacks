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
    try { var output = parse() }
    catch (err) {
      this.emit('error', new Error(
        err.toString().replace('Error: ', '') + ' (' + file + ')')
      );
    }
    
    if (pending === 0) finish(output);
  }
  
  function finish (output) {
    tr.queue(String(output));
    tr.queue(null);
  }

  function getConfig() {
    var env = process.env;
    var ret = {method: []};
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
  
  function parse () {
    var output = falafel(data, function (node) {
      // Are we a `console.*` node
      if (
           node.callee
        && node.callee.parent
        && node.callee.parent.type === "CallExpression"
        && node.callee.type        === 'MemberExpression'
        && node.callee.object.type === 'Identifier'
        && node.callee.object.name === "console"
      ) {
        // Get the core method name
        var methodName = node.callee.property.name.replace(/End$/, "");
        var config = getConfig();

        var include = (config.disable === true || config.method[methodName]);

        // Check log levels
        if(config.loglevel && LOG_LEVELS.indexOf(methodName) > -1) {
          var methodIndex = LOG_LEVELS.indexOf(methodName);
          var levelIndex  = LOG_LEVELS.indexOf(config.loglevel);

          if(methodIndex >= levelIndex) {
            include = true;
          } else {
            include = false;
          }
        }

        if(!include) {
          // Leave behind a ";" just to be safe
          node.update(";");
        }
      }
    });

    return output;
  }
};
