
angular.module('itouch.controllers')
.controller("AppCtrl", ['SyncService', '$scope', '$ionicLoading', 'LocationService', 'Logger', '$localStorage', 'AuthService', '$state', '$ionicHistory', 'Alert', 'CartItemService', '$cordovaKeyboard', 'UploadService', '$ionicModal',
  function (SyncService, $scope, $ionicLoading, LocationService, Logger, $localStorage, AuthService, $state, $ionicHistory, Alert, CartItemService, $cordovaKeyboard, UploadService, $ionicModal) {
    var currentUser = AuthService.currentUser();

    ionic.Platform.ready(function () {
      LocationService.get();
      Logger.init();
      ionic.Platform.fullScreen();
    });

    $scope.config = $localStorage.itouchConfig;

    $scope.sync = function () {
      SyncService.do().then(function () {
        $scope.$broadcast('sync');
        $scope.$broadcast("refresh-cart");
      })
    }

    $scope.upload = function () {
      UploadService.upload().then(function () {
        Alert.success('Upload success');
      }, function (err) {
        Alert.error(err);
      })
    }

    $scope.loadingShow = function () {
      $ionicLoading.show({
        template: '<ion-spinner icon="lines"></ion-spinner>',
        noBackdrop: false
      });
    };

    $scope.loadingHide = function () {
      $ionicLoading.hide();
    };

    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if (toState.resolve) {
        $scope.loadingShow();
      }
    });
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      if (toState.resolve) {
        $scope.loadingHide();
      }
    });

    /**
     * Uses the current user's description level (selected language) to output the given attribute
     * @param object
     * @param attribute
     * @returns String
     */
    $scope.print = function (object, attribute, level, trimFrom) {
      if(currentUser){
        var name = attribute + currentUser.DescriptionLevel;
        if(level){
          name += level;
        }
        if(_.isUndefined(object) || _.isUndefined(object[name])){
          return null;
        } else {
          if(trimFrom && trimFrom > 0 && object[name].length > trimFrom){
            return object[name].slice(0, trimFrom) + "..";
          } else {
            return object[name];
          }
        }
      }
    }

    /**
     *
     * @param url
     * @param root
     * @param params
     */
    $scope.go = function(url, root, params){
      if(root){
        $ionicHistory.nextViewOptions({
          disableAnimate: false,
          disableBack: true
        });
      }
      $state.go(url, params, {reload: true});
    }

    $scope.logout = function () {
      Alert.showConfirm('Are you sure?', 'Logout', function(res){
        if(res == 1){
          CartItemService.isEmpty().then(function(empty){
            if(!empty){
              Alert.warning('Cart is not empty!');
            } else {
              $scope.go('login', true);
            }
          });
        }
      });
    }

    $scope.imageUrl = function(imageName){
      if(imageName){
        if(window.cordova){
          var name = imageName.substr(imageName.lastIndexOf('/') + 1);
      //     if(imageExists(name)){
            return cordova.file.dataDirectory + "userImages/"+name;
      //     } else {
      //       return null;
      //     }
      //
        } else {
      //     if(imageExists("main/assets/"+imageName)){
      //       return "main/assets/"+imageName;
      //     } else {
      //       return null;
      //     }
        }
      } else {
        return null;
      }

    }

    function imageExists(image_url){

      var http = new XMLHttpRequest();

      http.open('HEAD', image_url, false);
      http.send();

      return http.status != 404;

    }

    $scope.doubleClickHandle = function(){
      return false;
    }

    $scope.openAdminLogin = function(){
      if($scope.adminLoginModal){
        $scope.adminLoginModal.show();
      }

    }

    /**
     * Initiating discount modal dialog
     */
    $ionicModal.fromTemplateUrl('main/adminPanel/adminLoginModal.html', {
      scope: $scope,
      backdropClickToClose: false,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.adminLoginModal = modal;
    });

    $scope.$on("loginlModal-close", function(event, data){
      $scope.adminLoginModal.hide();
      if(data && data.login){
        $state.go('app.admin');
      }
    });

  }]);
