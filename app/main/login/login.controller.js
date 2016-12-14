/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("LoginCtrl", ['$scope', 'AuthService', '$state', 'Alert', function ($scope, AuthService, $state, Alert) {
    $scope.credentials = {
      username: null,
      password: null
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data){
      // handle event
      $scope.credentials = {
        username: null,
        password: null
      };
    });

    $scope.doLogin = function () {
      if($scope.credentials.username && $scope.credentials.password){
        AuthService.attempt($scope.credentials.username, $scope.credentials.password).then(function () {
          $state.go('app.home');
        }, function (err) {
          Alert.showAlert('Login Failed', err, 'warning-alert');
          console.log(err);
        });
      }
    }

    $scope.loadConfig = function () {
      AuthService.syncUsers();
    }
  }]);
