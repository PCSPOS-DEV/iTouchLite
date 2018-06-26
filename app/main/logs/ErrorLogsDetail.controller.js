/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('ErrorLogsDetailCtrl', ['Alert', '$localStorage', '$scope', '$rootScope', 'SettingsService', '$state',
    function (Alert, $localStorage, $scope, $rootScope, SettingsService, $state) {
      var self = this;
      errorLog = SettingsService.StartErrorLog();
      $scope.newlogs = errorLog.getLog();
      // console.log( $scope.newlogs);

      self.Back2Logs = function () {
        $state.go('app.admin');
      }
      

    }]);
