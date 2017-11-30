/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("TempLoginCtrl", ['$scope', 'AuthService', '$state', 'Alert', function ($scope, AuthService, $state, Alert) {
    $scope.credentials = {
      username: null,
      password: null
    };

    $scope.$on("modal.shown", function(event, modal){
      if(modal.id == 11 || modal.id == 12){
        $scope.credentials = {
          username: null,
          password: null
        };
      }
    });

    $scope.doLogin = function () {
      if($scope.credentials.username && $scope.credentials.password){
        AuthService.attempt($scope.credentials.username, $scope.credentials.password, true).then(function (user) {
          console.log('login success');
          AuthService.setTempUser(user);
          $scope.$emit("loginlModal-close");
        }, function (err) {
          Alert.warning('Login Failed');
          $scope.$emit('loginlModal-close', true);
          console.log(err);
        });
      }
    }

    $scope.loadConfig = function () {
      AuthService.syncUsers();
    }

    $scope.close = function () {
      $scope.$emit('loginlModal-close', true);
    }
  }]);
