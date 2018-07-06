
angular.module('itouch.services')
  .service('ImageDownloadService', ['DB', 'DB_CONFIG', '$q', 'SettingsService', '$cordovaFileTransfer', '$localStorage', 'Alert', 'KeyBoardService', '$cordovaFile', 'LogService',
    function (DB, DB_CONFIG, $q, SettingsService, $cordovaFileTransfer, $localStorage, Alert, KeyBoardService, $cordovaFile, LogService) {
      var self = this;
      var entityId;
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();

      self.getImageNames = function () {
        return KeyBoardService.getLayout().then(function (layout) {
          if (layout) {
            return DB.select(DB_CONFIG.tableNames.keyboard.keys, 'ImageName', { columns: 'KeyboardLayoutId = ? AND ImageName != ?', data: [layout.LayoutId, ''] }).then(function (res) {
              return (DB.fetchAll(res));
            });
          }
        });

      };

      self.downloadFile = function (imageName) {
        eventLog.log('Download file : Start');
        var config = $localStorage.itouchConfig;
        var name = imageName.substr(imageName.lastIndexOf('/') + 1);
        var url = config.baseUrl + 'DownloadImage?ImageName=' + name;
        var options = {};
        if (config.baseUrl && window.cordova && name) {
          var targetPath = cordova.file.dataDirectory + 'userImages/' + name;
          var trustHosts = true;
          eventLog.log('Download file : Finish');
          return $cordovaFileTransfer.download(url, targetPath, options, trustHosts);
        } else {
          errorLog.log('Unable to download image file');
          return $q.reject('Unable to download file');

        }
      };

      self.downloadImages = function () {
        eventLog.log('Download image');
        LogService.SaveLog();
        return self.getImageNames().then(function (images) {
          if (window.cordova && images && images.length > 0) {
            var promises = [];

            angular.forEach(images, function (row) {
              if (row.ImageName) {
                promises.push(self.downloadFile(row.ImageName));
              }
            });

            return ionic.Platform.ready(function () {
              return $q.all([
                $cordovaFile.moveDir(cordova.file.dataDirectory, 'userImages', cordova.file.dataDirectory, 'tempUserImages'),
                $cordovaFile.createDir(cordova.file.dataDirectory, 'userImages', false)
              ]).then(function () {
                return $q.all(promises).then(function () {
                  return $cordovaFile.removeDir(cordova.file.dataDirectory, 'tempUserImages');
                }, function (ex) {
                  return $q.all([
                    $cordovaFile.removeDir(cordova.file.dataDirectory, 'userImages'),
                    $cordovaFile.moveDir(cordova.file.dataDirectory, 'tempUserImages', cordova.file.dataDirectory, 'userImages')
                  ]);
                });
              });

            });
          } else {
            errorLog.log('no images in the db', 5);
            LogService.SaveLog();
            return $q.reject('no images in the db');
          }
        });
        // self.downloadFile('PCSlogo.png');
      };


      return self;
    }]);
