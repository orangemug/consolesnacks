var _       = require("lodash");
var rc      = require("rc");
var through = require('through');
var falafel = require('falafel');

var LOG_LEVELS = [
  "dev",
  "log",
  "info",
  "warn",
  "error"
];

var conf = rc("consolesnacks");

// Set the env
if(process.env["CONSOLESNACKS_ENV"]) {
  ENV = process.env["CONSOLESNACKS_ENV"];
} else if(process.env["ENV"]) {
  ENV = process.env["ENV"];
} else {
  ENV = "default";
}


module.exports = function (file, configOpts) {
  if (/\.json$/.test(file)) return through();
  var data = '';

  if(typeof(configOpts) !== "object") {
    configOpts = {};
  }
  
  var tr = through(write, end);
  return tr;
  
  function write(buf) {
    data += buf
  }

  function end() {
    var output, self = this;
    var config = getConfig();

    try { output = parse(config) }
    catch (err) {
      self.emit('error', new Error(
        err.toString().replace('Error: ', '') + ' (' + file + ')')
      );
    }

    finish(output);
  }
  
  function finish(output) {
    tr.queue(String(output));
    tr.queue(null);
  }

  function getConfig() {

    // Set initial state
    var ret = {
      method:   [],
      disable:  false,
      loglevel: undefined
    };

    if(conf && !configOpts.disableRc) {
      ret = _.extend(ret, conf[ENV]);
    }

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

    ret = _.extend(ret, configOpts);

    return ret;
  }
  
  function parse(config) {
    var output = falafel(data, function (node) {
      if(config.disable) {
        return;
      }

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
