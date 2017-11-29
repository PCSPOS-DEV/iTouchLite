/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('ImageSetupCtrl', ['$log', '$cordovaImagePicker', 'Alert', '$cordovaFile', '$localStorage', '$rootScope', '$scope',
    function ($log, $cordovaImagePicker, Alert, $cordovaFile, $localStorage, $rootScope, $scope) {
      var self = this;

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
                //an error occured
              });
            }
          }, function (error) {
            // error getting photos
          });
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
                //an error occured
              });

            }
          }, function (error) {
            // error getting photos
          });
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
