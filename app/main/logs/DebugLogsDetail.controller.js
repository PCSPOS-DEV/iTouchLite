/**
 * Created by Lynn
 */
angular.module('itouch.controllers')
  .controller('DebugLogsDetailCtrl', ['Alert', '$localStorage', '$scope', '$rootScope', 'SettingsService', '$state',
    function (Alert, $localStorage, $scope, $rootScope, SettingsService, $state) {
      var self = this;
      debugLog = SettingsService.StartDebugLog();
      $scope.newlogs = debugLog.getLog();
      // console.log( $scope.newlogs);

      self.Back2Logs = function () {
        $state.go('app.admin');
      };


    }]);
