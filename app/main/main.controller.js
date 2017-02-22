
angular.module('itouch.controllers')
.controller("AppCtrl", ['SyncService', '$scope', '$ionicLoading', 'LocationService', 'Logger', 'APP_CONFIG', 'AuthService', '$state', '$ionicHistory', 'ShiftService', '$timeout',
  function (SyncService, $scope, $ionicLoading, LocationService, Logger, APP_CONFIG, AuthService, $state, $ionicHistory, ShiftService, $timeout) {
    var currentUser = AuthService.currentUser();

    ionic.Platform.ready(function () {
      LocationService.get();
      Logger.init();
      ionic.Platform.fullScreen();
    });


    $scope.$on('shift-changed', function(evt, shift){
      console.log('shift-changed');
      var shift = ShiftService.getCurrent();
      $ionicHistory.nextViewOptions({
        disableAnimate: false,
        disableBack: true
      });
      if(shift){
        $state.go('app.sales');
      } else {
        $state.go('app.home');
      }
    });

    $scope.config = APP_CONFIG;

    $scope.sync = function () {
      SyncService.do().then(function () {
        $scope.$broadcast('sync');
        $scope.$broadcast("refresh-cart");
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

    /**
     * Uses the current user's description level (selected language) to output the given attribute
     * @param object
     * @param attribute
     * @returns String
     */
    $scope.print = function (object, attribute, level) {
      if(currentUser){
        var name = attribute + currentUser.DescriptionLevel;
        if(level){
          name += level;
        }
        if(_.isUndefined(object) || _.isUndefined(object[name])){
          return null;
        } else {
          return object[name];
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
      $state.go('login');
    }

  }]);
