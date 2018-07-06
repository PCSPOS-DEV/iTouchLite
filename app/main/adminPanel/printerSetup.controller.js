/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('PrinterSetupCtrl', ['PrintService', 'Alert', '$localStorage', '$scope', '$rootScope', 'LogService',
    function (PrintService, Alert, $localStorage, $scope, $rootScope, LogService) {
      var self = this;
      self.status = PrintService.isConnected();
      self.printerSettings = $localStorage.printeSettings;
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();
      // errorLog.log(''+ err, 4);

      $rootScope.$on('viewOpen', function (event, data) {

        if (data === 'printer') {
          $scope.loadingHide();
          self.status = PrintService.isConnected();
          self.printerSettings = $localStorage.printeSettings;
        }
      });


      self.save = function (ip, port) {
        PrintService.setIPAddress(ip);
        PrintService.setPort(port);

        PrintService.connect().then(function () {
          Alert.success('Success');
          errorLog.log('Printer Setup : Success' );
          self.status = PrintService.isConnected();
        }, function (err) {
          errorLog.log('Printer Setup : ' + err, 4);
          Alert.success(err, 'Error');
        });
      };


    }]);
