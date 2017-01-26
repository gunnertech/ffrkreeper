'use strict'


function runInBg() {
  if(process.env.NODE_ENV == 'development') {
    var fn = [].shift.apply(arguments);
    fn.apply(fn, arguments);
  }
}


module.exports = {
  runInBg: runInBg
};