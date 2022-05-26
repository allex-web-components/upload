function createLib (execlib, applib) {
  'use strict';

  var mylib = {};

  require('./elements')(execlib, applib);

  return mylib;
}
module.exports = createLib;