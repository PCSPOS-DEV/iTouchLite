/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('ShiftLogsDetailCtrl', ['Alert', '$localStorage', '$scope', '$rootScope', 'ShiftService', '$state',
    function (Alert, $localStorage, $scope, $rootScope, ShiftService, $state) {
      var self = this;
      shiftLog = ShiftService.StartShiftLog();
      $scope.newlogs = shiftLog.getLog();
      // console.log( $scope.newlogs);

      self.Back2Logs = function () {
        $state.go('app.admin');
      }
      

    }]);