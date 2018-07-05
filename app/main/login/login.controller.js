/**
 * Created by shalitha on 17/5/16.
 */
var onLogin;
angular.module('itouch.controllers')
  .controller('LoginCtrl', ['$scope', 'AuthService', '$state', 'Alert', '$cordovaKeyboard', '$ionicModal',
    function ($scope, AuthService, $state, Alert, $cordovaKeyboard, $ionicModal) {
      var self = this;
      $scope.credentials = {
        username: null,
        password: null
      };

      $scope.$on('$ionicView.beforeEnter', function (event, data) {
      // handle event
        $scope.credentials = {
          username: null,
          password: null
        };
      });

      $scope.$on('$ionicParentView.enter', function (event, data) {
        console.log('parent.enter');
      });

      $scope.$on('$ionicView.enter', function (event, data) {
        console.log('enter');
      });

      self.doLogin = function () {
        if ($scope.credentials.username && $scope.credentials.password) {
          AuthService.attempt($scope.credentials.username, $scope.credentials.password).then(function () {
            $state.go('app.home');
          }, function (err) {
            Alert.showAlert('Login Failed', err, 'warning-alert');
            console.log(err);
          });
        }
      };
      $scope.loadConfig = function () {
        AuthService.syncUsers();
      };

      $scope.openAdminLogin = function () {
        if ($scope.discountModal) {
          $scope.discountModal.show();
        }

      };

    /**
     * Initiating discount modal dialog
     */
      $ionicModal.fromTemplateUrl('main/adminPanel/adminLoginModal.html', {
        id: 10,
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.discountModal = modal;
      });

      $scope.$on('loginlModal-close', function (event, data) {
        $scope.discountModal.hide();
        if (data && data.login) {
          $state.go('app.admin');
        }
      });

    }]);
