var testing = function() {
  var testing = "hello";
  0;
}

module.exports = function() {
  var st = "bananas";
  var i = 10;

  console.profile("Something");
  while(i>0) {
    0;
    i--;
  }
  console.profileEnd("Something");

  console.time("Something");
  i=9999;
  while(i>0) {
    i--;
  }
  console.timeEnd("Something");

  switch(st) {
    case "bananas":
      0;
      break;
    case "apple":
      0;
      break;
    default:
      0;
  }
};
