var testing = function() {
  var testing = "hello";
  console.log(testing);
}

module.exports = function() {
  var st = "bananas";
  var i = 10;

  0;
  while(i>0) {
    console["info"]("hello");
    i--;
  }
  0;

  0;
  i=9999;
  while(i>0) {
    i--;
  }
  0;

  switch(st) {
    case "bananas":
      console.dev("Yay!"+1+"hello");
      break;
    case "apple":
      console.warn("Hmmm not \
                   quite\
                   an error");
      break;
    default:
      console.error("Arrgh");
  }
};
