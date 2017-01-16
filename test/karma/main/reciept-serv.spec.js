'use strict';

describe('module: main, service: Reciept', function () {

  // load the service's module
  beforeEach(module('main'));
  // load all the templates to prevent unexpected $http requests from ui-router
  beforeEach(module('ngHtml2Js'));

  // instantiate service
  var Reciept;
  beforeEach(inject(function (_Reciept_) {
    Reciept = _Reciept_;
  }));

  it('should do something', function () {
    expect(!!Reciept).toBe(true);
  });

});
