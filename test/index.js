require("should");

var _             = require("lodash");
var fs            = require("fs");
var through       = require("through");
var consolesnacks = require("../");

var FILES = [
  {filename: "test_none.js"},
  {filename: "test_error.js", loglevel: "error"},
  {filename: "test_warn.js",  loglevel: "warn"},
  {filename: "test_info.js",  loglevel: "info"},
  {filename: "test_log.js",   loglevel: "log"},
  {filename: "test_dev.js",   loglevel: "dev"},
  {filename: "test_method.js", method: [
    "time"
  ]},
  {filename: "test_multi_method.js", method: [
    "time",
    "profile"
  ]},
];

describe("consolesnacks", function() {

  FILES.forEach(function(obj) {
    var filename = obj.filename;
    var level    = obj.loglevel;
    var methods  = obj.method;

    it("testing: "+filename, function(done) {
      fs.readFile(__dirname+"/outfile/"+filename, function(err, outData) {
        if(err) done(err);
        var Writable = require('stream').Writable;
        var ws = Writable();

        // Do this properly
        var data = ""
        var tr = through(function(chunk) {
          data += chunk.toString();
        }, function() {
          data.should.eql(outData.toString());
          done();
        });

        var path = __dirname+"/infile/test_all.js";
        var rs = fs.createReadStream(path)

        // Remove and console snacks from the env object so we have a clean slate
        for(var k in process.env) {
          if(k.match(/^CONSOLESNACKS_.*$/)) {
            delete process.env[k];
          }
        }

        if(level) {
          process.env["CONSOLESNACKS_LOGLEVEL"] = level;
        }
        if(methods) {
          methods.forEach(function(method) {
            var envVar = "CONSOLESNACKS_METHOD_"+method.toUpperCase();
            process.env[envVar] = "true";
          });
        }
        rs.pipe(consolesnacks({disableRc: true})).pipe(tr);
      });
    });

    it("testing: "+filename+" with opts", function(done) {
      fs.readFile(__dirname+"/outfile/"+filename, function(err, outData) {
        if(err) done(err);
        var Writable = require('stream').Writable;
        var ws = Writable();

        // Do this properly
        var data = ""
        var tr = through(function(chunk) {
          data += chunk.toString();
        }, function() {
          data.should.eql(outData.toString());
          done();
        });

        var path = __dirname+"/infile/test_all.js";
        var rs = fs.createReadStream(path)

				var opts = _.extend(obj, {disableRc: true});
        rs.pipe(consolesnacks(opts)).pipe(tr);
      });
    });
  });

});
