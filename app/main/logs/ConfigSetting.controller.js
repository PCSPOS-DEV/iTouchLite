/**
 * Created by Lynn
 */
angular.module('itouch.controllers')
  .controller('ConfigSettingCtrl', ['Alert', '$localStorage', '$scope', '$rootScope', 'PrintService', '$state', '$ionicHistory', 'LogService', 'SettingsService', 'AppConfig', '$http',
    function (Alert, $localStorage, $scope, $rootScope, PrintService, $state, $ionicHistory, LogService, SettingsService, AppConfig, $http) {
      var self = this;

      self.connect = function (ip, port) {
        Alert.showLoading();
        PrintService.connect().then(function () {
          Alert.success('Success');
          self.status = PrintService.isConnected();
        }, function (err) {
          errorLog.log('Printer Setup : ' + err, 4);
          Alert.success(err, 'Error');
        });
        Alert.hideLoading();
      };
      // console.log( $scope.newlogs);

      $scope.DeleteAllFunction = function () {
        var MachineId = SettingsService.getMachineId();
        var requestUrl = AppConfig.getDisplayUrl() + '/Item';
        $http({
          method: 'DELETE',
          url: requestUrl + '/' + MachineId,
          headers: {
            'Content-Type': 'application/json'
          },
        }).then(function successCallback (response) {
          console.log('Delete');
          console.log(response);
          eventLog.log('2nd Display: Delete All Success');
        }, function errorCallback (response) {
          console.log(response);
          errorLog.log('2nd Display Delete All Fail : ' + response.status + ' ' + response.statusText);
        });
      };

      self.clearDisplay = function () {
        $scope.DeleteAllFunction();
      };

      self.sendLog = function () {
        LogService.PostLogData();
        Alert.success('Log Sent Successfully');
      };

      self.sendLogViaEmail = function () {
        LogService.EmailLogData();
      };

      self.Back = function () {
        var back = $ionicHistory.backView();
        // console.log(back);
        if (back) {
          $ionicHistory.goBack();
        } else {
          $state.go('login');
        }
      };


    }]);
