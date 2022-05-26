(function (execlib) {
  var lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib');
  lR.register('allex_uploadwebcomponent', require('./libindex')(execlib, applib));
})(ALLEX);