
angular.module('itouch.controllers')
.controller('AppCtrl', ['SyncService', '$scope', '$ionicLoading', 'LocationService', 'Logger', '$localStorage', 'AuthService', '$state', '$ionicHistory', 'Alert', 'CartItemService', '$cordovaKeyboard', 'UploadService', '$ionicModal', 'LogService',
  function (SyncService, $scope, $ionicLoading, LocationService, Logger, $localStorage, AuthService, $state, $ionicHistory, Alert, CartItemService, $cordovaKeyboard, UploadService, $ionicModal, LogService) {
    var currentUser = AuthService.currentUser();
    eventLog = LogService.StartEventLog();
    errorLog = LogService.StartErrorLog();
    $scope.loadLogo = function () {
      try {
        eventLog.log('setImages loadLogo Start ');
        if ($localStorage && $localStorage.images) {
          var image = new Image();
          image.style.width = '100px';
          image.style.height = '100px';
          image.src = $localStorage.images.logo;
          image.onload = function () {
            // show message
            // alert('Image:Width' + image.width + 'px, Height' + image.height + 'px');
            // draw image
            var canvas = document.getElementById('canvas');
            if (canvas.getContext) {
              canvas.width = image.width;
              canvas.height = image.height;
              var context = canvas.getContext('2d');
              context.drawImage(image, 0, 0);
            }
          };
          eventLog.log('setImages loadLogo Complete');
        }

      }
      catch (e) {
        alert(e.message);
        errorLog.log('setImages loadLogo Error : ' + e.message);
      }
      LogService.SaveLog();
    };

    $scope.setImages = function () {
      if ($localStorage.images) {
        $scope.images = $localStorage.images;
        $scope.loadLogo();
      }
    };
    $scope.setImages();

    ionic.Platform.ready(function () {
      LocationService.get();
      Logger.init();
      ionic.Platform.fullScreen();
    });


    $scope.config = $localStorage.itouchConfig;

    $scope.sync = function () {
      SyncService.do().then(function () {
        $scope.$broadcast('sync');
        $scope.$broadcast('refresh-cart');
      });
    };
    uploadLog = UploadService.StartuploadLog();
    var uploadClicked = false;
    $scope.upload = function () {
      eventLog.log('Upload Start: ');
      if (!uploadClicked) {
        uploadClicked = true;
        uploadLog.clear();
        UploadService.upload().then(function () {
          uploadLog.log('Upload Success : Manual Upload', 2);
          uploadLog.log('-----*-----', 7);
          var uploadlog = localStorage.getItem('UploadLogs');
          // console.log(uploadlog);
          localStorage.removeItem('UploadLogs');
          var logs = uploadLog.getLog();
          // console.log(logs);
          if (uploadlog == null) {
            uploadlog = '';
          }
          eventLog.log('Upload Complete: ');
          try {
            localStorage.setItem('UploadLogs', uploadlog + logs);
          } catch (ex1) {
            // if ( ex1.name === 'QuotaExceededError' || ex1.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            uploadLog.log('Errorlog : QuotaExceededError');
            LogService.sendUploadLog();
            // } else {
            //   uploadlog.log('Important Error : ' + ex1);
            // }
          }
          Alert.success('Upload success');
        }, function (err) {
          errorLog.log('Upload Error : ' + err, 4);
          uploadLog.log('Upload Error : ' + err, 4);
          uploadLog.log('-----*-----', 7);
          var uploadlog = localStorage.getItem('UploadLogs');
          var logs = uploadLog.getLog();
          // console.log(uploadlog);
          localStorage.removeItem('UploadLogs');
          // console.log(logs);
          if (uploadlog == null) {
            uploadlog = '';
          }
          try {
            localStorage.setItem('UploadLogs', uploadlog + logs);
          } catch (ex1) {
            // if ( ex1.name === 'QuotaExceededError' || ex1.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            uploadLog.log('Errorlog : QuotaExceededError');
            LogService.sendUploadLog();
            // } else {
            //   uploadLog.log('Important Error : ' + ex1);
            // }
          }
          Alert.error(err);
        }).finally(function () {
          uploadClicked = false;
        });
      }
      LogService.SaveLog();
    };

    $scope.loadingShow = function () {
      $ionicLoading.show({
        template: '<ion-spinner icon="lines"></ion-spinner>',
        noBackdrop: false
      });
    };

    $scope.loadingHide = function () {
      $ionicLoading.hide();
    };

    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if (toState.resolve) {
        $scope.loadingShow();
      }
    });
    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
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
      // eventLog.log('Print Keyboard : Start ');
      currentUser = AuthService.currentUser();
      var name;
      if (currentUser) {
        name = attribute + currentUser.DescriptionLevel;
        if (level) {
          name += level;
        }

        if (_.isUndefined(object) || _.isUndefined(object[name]) || _.isNull(object[name])) {
          return null;
        } else {
          if (trimFrom && trimFrom > 0 && object[name].length > trimFrom) {
            return object[name].slice(0, trimFrom) + '..';
          } else {
            return object[name];
          }
        }
      }
      else
      {
        name = attribute + 1;
        return object[name];
      }
    };


    /**
     *
     * @param url
     * @param root
     * @param params
     */
    $scope.go = function (url, root, params) {
      if (root) {
        $ionicHistory.nextViewOptions({
          disableAnimate: false,
          disableBack: true
        });
      }
      $state.go(url, params, {reload: true});
    };

    $scope.logout = function () {
      Alert.showConfirm('Are you sure?', 'Logout', function (res) {
        eventLog.log('Logout Start: ');
        if (res == 1) {
          CartItemService.isEmpty().then(function (empty) {
            if (!empty) {
              eventLog.log('Logout Cancel : Cart is not empty');
              Alert.warning('Cart is not empty!');
            } else {
              eventLog.log('Logout Complete: ');
              $scope.go('login', true);
            }
          });
        }
        LogService.SaveLog();
      });
    };

    $scope.imageUrl = function (imageName) {
      if (imageName) {

        if (window.cordova) {
          var name = imageName.substr(imageName.lastIndexOf('/') + 1);
      //     if(imageExists(name)){
          return cordova.file.dataDirectory + 'userImages/' + name;
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

    };

    function imageExists (image_url) {

      var http = new XMLHttpRequest();

      http.open('HEAD', image_url, false);
      http.send();

      return http.status !== 404;

    }

    $scope.doubleClickHandle = function () {
      return false;
    };


    /**
     * Initiating discount modal dialog
     */
    var adminLoginModal;
    $ionicModal.fromTemplateUrl('main/adminPanel/adminLoginModal.html', {
      id: 10,
      scope: $scope,
      backdropClickToClose: false,
      animation: 'slide-in-up'
    }).then(function (modal) {
      adminLoginModal = modal;
    });

    $scope.openAdminLogin = function () {
      if (adminLoginModal) {
        adminLoginModal.show();
      }
    };

    $scope.configSetting = function () {
      $state.go('app.configsettings');
    };

    $scope.$on('loginlModal-close', function (event, data) {
      if (adminLoginModal) {
        adminLoginModal.hide();
        if (data && data.login) {
          $state.go('app.admin');
        }
      }
    });
    $scope.Menu = false;
    $scope.ToggleMenu = function () {
      setTimeout(function () {
        $scope.$broadcast('CartCheck');
      }, 200);
      $scope.$on('BlockMenu', function (event, check) {
        if (check == false) {
          $scope.Menu = true;
        } else {
          $scope.Menu = false;
        }
      });
    };

    $scope.$on('BlockMenu', function (event, check) {
      if (check == false) {
        $scope.Menu = true;
      } else {
        $scope.Menu = false;
      }
    });

  }]);
