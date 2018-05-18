/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('DebugLogsDetailCtrl', ['$log', 'Alert', '$localStorage', '$scope', '$rootScope', 'SettingsService', '$state',
    function ($log, Alert, $localStorage, $scope, $rootScope, SettingsService, $state) {
      var self = this;
      debugLog = SettingsService.StartDebugLog();
      $scope.newlogs = debugLog.getLog();
      // console.log( $scope.newlogs);

      self.Back2Logs = function () {
        $state.go('app.admin');
      }
      

    }]);
