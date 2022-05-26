function createUploadElement (execlib, applib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    BasicElement = applib.getElementType('BasicElement');

  function UploadElement (id, options) {
    if (!(options && options.uploadPath)) {
      throw new lib.Error('MISSING_UPLOAD_PATH', this.constructor.name+' must get an uploadPath in its options');
    }
    if (!(options && options.environmentname)) {
      throw new lib.Error('MISSING_ENVIRONMENTNAME', this.constructor.name+' must get an environmentname in its options');
    }
    BasicElement.call(this, id, options);
    this.url = null;
    this.uploading = null;
  }
  lib.inherit(UploadElement, BasicElement);
  UploadElement.prototype.__cleanUp = function () {
    this.uploading = null;
    this.url = null;
    BasicElement.prototype.__cleanUp.call(this);
  };
  UploadElement.prototype.initialEnvironmentDescriptor = function (myname) {
    var uploadPath = this.getConfigVal('uploadPath'),
      _environmentname = this.getConfigVal('environmentname');
    return {
      preprocessors: {
        DataSource: [{
          environment: _environmentname,
          entity: {
            name: uploadPath,
            type: 'allexstate',
            options: {
              sink: '.',
              path: uploadPath
            }
          }
        }]
      },
      links: [{
        source: 'datasource.'+uploadPath+':data',
        target: 'element.'+myname+':url'
      }]
    }
  };
  UploadElement.prototype.upload = function (upploadhash) {
    return this.jobs.run('u', qlib.newSteppedJobOnSteppedInstance(
      new UploadJobCore(this, upploadhash)
    ));
  };

  function UploadJobCore (elem, hash) {
    this.elem = elem;
    this.hash = hash;
    this.defer = q.defer();
  }
  UploadJobCore.prototype.destroy = function () {
    this.defer = null;
    this.hash = null;
    this.elem = null;
  };
  UploadJobCore.prototype.shouldContinue = function () {
    if (!(this.elem && this.elem.destroyed)) {
      return new lib.Error('UPLOAD_ELEMENT_ALREADY_DESTROYED');
    }
    if (!this.elem.get('url')) {
      return new lib.Error('CANNOT_UPLOAD_WITHOUT_A_URL');
    }
    if (!this.defer) {
      return new lib.Error('ALREADY_DESTROYED');
    }
  };
  UploadJobCore.prototype.init = function () {
    var orighash = this.hash || {},
      hash = {},
      ret = this.defer.promise;
    hash.method = orighash.method || 'POST';
    if ('parameters' in orighash) {
      hash.parameters = orighash.parameters;
    }
    hash.onComplete = this.onComplete.bind(this);
    hash.onError = this.onError.bind(this);
    lib.request(this.elem.get('url'), hash);
    this.elem.set('uploading', true);
    return ret;
  };

  UploadJobCore.prototype.onComplete = function (res) {
    this.elem.set('uploading', false);
    if (this.hash && lib.isFunction(this.hash.onComplete)) {
      this.hash.onComplete(res);
    }
    this.defer.resolve(res);
  };
  UploadJobCore.prototype.onError = function (reason) {
    this.elem.set('uploading', false);
    if (this.hash && lib.isFunction(this.hash.onError)) {
      this.hash.onError(reason);
    }
    this.defer.reject(reason);
  };

  UploadJobCore.prototype.steps = [
    'init'
  ];

  applib.registerElementType('UploadElement', UploadElement);
}
module.exports = createUploadElement;