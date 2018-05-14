/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('UploadLogsDetailCtrl', ['$log', 'Alert', '$localStorage', '$scope', '$rootScope', 'UploadService', '$state',
    function ($log, Alert, $localStorage, $scope, $rootScope, UploadService, $state) {
      var self = this;
      uploadLog = UploadService.StartuploadLog();
      $scope.newlogs = uploadLog.getLog();
      // console.log( $scope.newlogs);

      self.Back2Logs = function () {
        $state.go('app.admin');
      }
      

    }]);
