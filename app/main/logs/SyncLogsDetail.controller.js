/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('SyncLogsDetailCtrl', ['$log', 'Alert', '$localStorage', '$scope', '$rootScope', 'SettingsService', '$state',
    function ($log, Alert, $localStorage, $scope, $rootScope, SettingsService, $state) {
      var self = this;
      syncLog = SettingsService.StartSyncLog();
      $scope.newlogs = syncLog.getLog();
      // console.log( $scope.newlogs);

      self.Back2Logs = function () {
        $state.go('app.admin');
      }
      

    }]);
