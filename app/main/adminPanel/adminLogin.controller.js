/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("AdminLoginCtrl", ['$scope', 'AuthService', '$state', 'Alert', function ($scope, AuthService, $state, Alert) {
    $scope.credentials = {
      username: null,
      password: null
    };

    $scope.$on("modal.shown", function(event, modal){
      if(modal.id == 10){
        $scope.credentials = {
          username: null,
          password: null
        };
      }
    });

    $scope.doLogin = function () {
      if($scope.credentials.username && $scope.credentials.password && $scope.credentials.username == 'pcs' && $scope.credentials.password == '099419'){
        $scope.$emit("loginlModal-close", { login: true });
      } else {
        Alert.error('Login Failed');
      }
    }

    $scope.close = function () {
      $scope.$emit('loginlModal-close', { login: false });
    }
  }]);
