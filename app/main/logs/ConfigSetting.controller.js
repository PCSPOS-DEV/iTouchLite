/**
 * Created by Lynn
 */
angular.module('itouch.controllers')
  .controller('ConfigSettingCtrl', ['Alert', '$localStorage', '$scope', '$rootScope', 'PrintService', '$state',
    function (Alert, $localStorage, $scope, $rootScope, PrintService, $state) {
      var self = this;
      
      self.connect = function (ip, port) {
        Alert.showLoading();
        PrintService.connect().then(function () {
          Alert.success('Success');
          self.status = PrintService.isConnected();
        }, function (err) {
          errorLog.log('Printer Setup : '+ err, 4);
          Alert.success(err, 'Error');
        });
        Alert.hideLoading();
      };
      // console.log( $scope.newlogs);

      // self.Back2Home= function () {
      //   $state.go('app.admin');
      // }
      

    }]);
