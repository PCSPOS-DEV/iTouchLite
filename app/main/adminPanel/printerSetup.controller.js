/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('PrinterSetupCtrl', ['$log', 'PrintService', 'Alert', '$localStorage', '$scope', '$rootScope',
    function ($log, PrintService, Alert, $localStorage, $scope, $rootScope) {
      var self = this;
      self.status = PrintService.isConnected();
      self.printerSettings = $localStorage.printeSettings;

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
          self.status = PrintService.isConnected();
        }, function (err) {
          Alert.success(err, 'Error');
        });
      };


    }]);
