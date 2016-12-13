'use strict';
angular.module('main')
.controller('DebugCtrl', function ($log, $http, $timeout, Main, Config, $cordovaDevice, PrintService) {

  $log.log('Hello from your Controller: DebugCtrl in module main:. This is your controller:', this);

  // bind data from services
  this.someData = Main.someData;
  this.ENV = Config.ENV;
  this.BUILD = Config.BUILD;

  this.printConfig = {
    ip: '192.168.1.205',
    port: '8008',
  };
  // get device info
  ionic.Platform.ready(function () {
    if (ionic.Platform.isWebView()) {
      this.device = $cordovaDevice.getDevice();
    }
  }.bind(this));

  // PASSWORD EXAMPLE
  this.password = {
    input: '', // by user
    strength: ''
  };
  this.grade = function () {
    var size = this.password.input.length;
    if (size > 8) {
      this.password.strength = 'strong';
    } else if (size > 3) {
      this.password.strength = 'medium';
    } else {
      this.password.strength = 'weak';
    }
  };
  this.grade();

  // Proxy
  this.proxyState = 'ready';
  this.proxyRequestUrl = Config.ENV.SOME_OTHER_URL + '/get';

  this.proxyTest = function () {
    this.proxyState = '...';

    $http.get(this.proxyRequestUrl)
    .then(function (response) {
      $log.log(response);
      this.proxyState = 'success (result printed to browser console)';
    }.bind(this))
    .then($timeout(function () {
      this.proxyState = 'ready';
    }.bind(this), 6000));
  };

  this.connect = function(){
    PrintService.connect(this.printConfig.ip, this.printConfig.port).then(function(scc){ $log.log('success', scc); }, function(ex){ $log.log('error', ex); });
  }

  this.disconnect = function(){
    PrintService.disconnect().then(function(scc){ $log.log('success', scc); }, function(ex){ $log.log('error', ex); });
  }

  this.print = function(){
    var printer = PrintService.getPrinter();

        if(!printer){
          $log.log('Printer not connected');
          return false;
        }

        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addText('Hello World\n');

        if(PrintService.isConnected()){
          printer.send();
        } else {
          $log.log('Not connected');
        }
  }

});
