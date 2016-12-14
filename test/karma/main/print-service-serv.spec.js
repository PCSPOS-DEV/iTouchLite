

describe('module: main, service: PrintService', function () {

  // load the service's module
  beforeEach(module('main'));
  // load all the templates to prevent unexpected $http requests from ui-router
  beforeEach(module('ngHtml2Js'));

  // instantiate service
  var PrintService;
  beforeEach(inject(function (_PrintService_) {
    PrintService = _PrintService_;
  }));

  it('should do something', function () {
    expect(!!PrintService).toBe(true);
  });

});
