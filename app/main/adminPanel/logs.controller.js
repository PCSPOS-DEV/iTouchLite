/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("LogsCtrl", ['$scope', 'AuthService', '$state', 'Alert', '$cordovaKeyboard', '$ionicModal',
    function ($scope, AuthService, $state, Alert, $cordovaKeyboard, $ionicModal) {  
      var self = this;
      
      $scope.$on('viewOpen', function (event, data) {
        if (data == 'logs') {
          $scope.loadingHide();
          // refresh();
        }
      });

      self.SyncLog = function () {
        $state.go('app.syncdetaillogs');
      }

      self.UploadLog = function () {
        $state.go('app.uploaddetaillogs');
      }

    }]);
