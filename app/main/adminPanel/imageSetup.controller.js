/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('ImageSetupCtrl', ['$log', '$cordovaImagePicker', 'Alert', '$cordovaFile', '$localStorage', '$rootScope', '$scope', 'SettingsService',
    function ($log, $cordovaImagePicker, Alert, $cordovaFile, $localStorage, $rootScope, $scope, SettingsService) {
      var self = this;
      errorLog = SettingsService.StartErrorLog();
      // errorLog.log(''+ err, 4);

      self.images = {};

      $rootScope.$on('viewOpen', function (event, data) {

        if (data == 'images') {
          refresh();
        }
      });

      var refresh = function () {
        $scope.loadingHide();
        if ($localStorage && $localStorage.images) {
          self.images = $localStorage.images;
        } else {
          self.images = {
            logo: 'main/assets/img/logo.png',
            cart_background: 'main/assets/img/cart_back.jpg',
          };
          $localStorage.images = self.images;
        }
      };

      refresh();

      self.pickLogo = function () {
        var options = {
          maximumImagesCount: 1,
          width: 100,
          height: 100,
          quality: 80
        };
        $cordovaImagePicker.getPictures(options)
          .then(function (results) {
            if (results.length > 0) {
              var image = _.first(results);
              var currentName = image.replace(/^.*[\\\/]/, '');
              // alert(currentName);
              moveFile(currentName).then(function (fileName) {
                self.images.logo = fileName;
                $localStorage.images.logo = fileName;
                $scope.setImages();
              }, function (error) {
                errorLog.log('Logo Image Setup Error : '+ error, 4);
                //an error occured
              });
            }
          }, function (error) {
            errorLog.log('Logo Image Getting Error : '+ error, 4);
            // error getting photos
          });
      };

      self.removeLogo = function () {
        if ($localStorage && $localStorage.images) {
          self.images.logo = 'main/assets/img/logo.png';
          $localStorage.images.logo = self.images.logo;
        }
      };

      self.pickCartBack = function () {
        var options = {
          maximumImagesCount: 1,
          width: 716,
          height: 300,
          quality: 90
        };
        $cordovaImagePicker.getPictures(options)
          .then(function (results) {
            if (results.length > 0) {
              var image = _.first(results);
              var currentName = image.replace(/^.*[\\\/]/, '');
              // alert(currentName);
              moveFile(currentName).then(function (fileName) {
                self.images.cart_background = fileName;
                $localStorage.images.cart_background = fileName;
              }, function (error) {
                errorLog.log('Cart Image Setup Error : '+ error, 4);
                //an error occured
              });

            }
          }, function (error) {
            errorLog.log('Cart Image Getting Error : '+ error, 4);
            // error getting photos
          });
      };

      self.removeCartBack = function () {
        if ($localStorage && $localStorage.images) {
          self.images.cart_background = 'main/assets/img/logo.png';
          $localStorage.images.cart_background = self.images.cart_background;
        }
      };

      var moveFile = function (name) {
        var d = new Date(),
          n = d.getTime(),
          newFileName = n + '.jpg';
        return $cordovaFile.moveFile(cordova.file.tempDirectory, name, cordova.file.dataDirectory, newFileName).then(function () {
          // alert(cordova.file.dataDirectory+newFileName);
          return cordova.file.dataDirectory + newFileName;
        });
      };

    }]);
