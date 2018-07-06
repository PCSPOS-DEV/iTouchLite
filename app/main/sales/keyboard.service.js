/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory('KeyBoardService', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', 'LogService',
    function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG, LogService) {
      var self = this;
      var pages;
      var keys;
      syncLog = SettingsService.StartSyncLog();
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();

      self.fetchLayout = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetKeyboardLayoutsByMachines').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            var kBLayouts = JSON.parse(res);
            if (kBLayouts) {
              self.saveLayout(kBLayouts);
              syncLog.log('  Layout Sync Complete', 1);
              deferred.resolve();
            } else {
              syncLog.log('  Layout Sync Error : Unknown machine', 1);
              deferred.reject('Unknown machine');
            }

          }, function (err) {
            console.error(err);
            syncLog.log('  Layout Sync Error : Unable to fetch data from the server', 1);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          syncLog.log('  Layout Sync Fail : ' + ex, 1);
          deferred.reject(ex);
        }

        return deferred.promise;
      };

      self.fetchPages = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetKeyboardPages').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            var pageSet = JSON.parse(res);
            if (pageSet && pageSet.length > 0) {
              self.savePages(pageSet);
              syncLog.log('  Page Sync Complete', 1);
              deferred.resolve(pageSet);
            } else {
              syncLog.log('  Page Sync Error : Unknown machine', 1);
              deferred.reject('Unknown machine');
            }

          }, function (err) {
            console.error(err);
            syncLog.log('  Page Sync Error : Unable to fetch data from the server', 1);
            deferred.reject('Unable to fetch data from the server');
          });

          Restangular.one('GetKeyboardPageInfo').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            var pageInfo = null;
          //var pageInfo = JSON.parse(res);
            if (!_.isUndefined(res)) {
              pageInfo = JSON.parse(res);
              if (pageInfo && pageInfo.length > 0) {
                pageInfo = _.map(pageInfo, function (pageKey) {
                  if (pageKey && pageKey.ImageName) {
                    if (pageKey.ImageName == 'No file was uploaded.') {
                      pageKey.ImageName = null;
                    } else {
                      pageKey.ImageName = 'img' + pageKey.ImageName.replace('~', '');
                    }
                  }

                  if (pageKey && pageKey.Colour) {
                    pageKey.Colour = argbToRGB(pageKey.Colour);
                  }
                  return pageKey;
                });
                self.savePageInfo(pageInfo);
                syncLog.log('  PageInfo Sync Complete', 1);
                deferred.resolve();
              } else {
                syncLog.log('  PageInfo Sync Error : Unknown machine', 1);
                deferred.reject('Unknown machine');
              }
            }
            else {
              syncLog.log('  PageInfo Sync Complete', 1);
              deferred.resolve();
            }

          }, function (err) {
            console.error(err);
            syncLog.log('  PageInfo Sync Error : Unable to fetch data from the server', 1);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          syncLog.log('  Page Sync Fail : ' + ex, 1);
          deferred.reject(ex);
        }


        return deferred.promise;
      };

      self.fetchKeys = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetKayboardKeyInfo').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            if (!_.isUndefined(res)) {
              keys = JSON.parse(res);
              if (keys && keys.length > 0) {
                keys = _.map(keys, function (key) {
                  if (key && key.ImageName) {
                    if (key.ImageName == 'No file was uploaded.') {
                      key.ImageName = null;
                    } else {
                      key.ImageName = 'img' + key.ImageName.replace('~', '');
                    }
                  }

                  if (key && key.Color) {
                    key.Color = argbToRGB(key.Color);
                  }
                  return key;
                });
                self.saveKeys(keys);
                syncLog.log('  Keys Sync Complete', 1);
                deferred.resolve(keys);
              } else {
                syncLog.log('  Keys Sync Error : Unable to fetch keys for this machine', 1);
                deferred.reject('Unable to fetch keys for this machine');
              }
            }
            else {
              deferred.resolve();
            }
          }, function (err) {
            console.error(err);
            syncLog.log('  Keys Sync Error : Unable to fetch data from the server', 1);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          syncLog.log('  Keys Sync Fail : ' + ex, 1);
          deferred.reject(ex);
        }

        return deferred.promise;
      };

      self.getLayout = function () {
        var deferred = $q.defer();
        DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.keyboard.layouts + ' WHERE MachineId = ?', [SettingsService.getMachineId()]).then(function (result) {
          deferred.resolve(DB.fetch(result));
        }, function (err) {
          deferred.reject(err.message);
        });
        return deferred.promise;
      };

      self.getKeys = function (layoutId) {
        return $q.all({
          keys: DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.keyboard.keys + ' WHERE KeyboardLayoutId = ? AND PageKeyNo IS NOT NULL ORDER BY PageKeyNo, KeyNo', [layoutId]).then(function (result) {
            return DB.fetchAll(result);
          }),
          keyboard: DB.query('SELECT * FROM view_keyboard WHERE KeyboardLayoutMasterId = ? ORDER BY MainPageId, KeyNo', [layoutId]).then(function (result) {
            return DB.fetchAll(result);
          })
        }).then(function (data) {
          var keys = data.keys.concat(data.keyboard);
          if (keys.length > 0) {
            var keyObject = {};
            _.each(data.keyboard, function (key) {

              if (!keyObject[key.MainPageId]) {
                keyObject[key.MainPageId] = [];
              }
              keyObject[key.MainPageId][key.KeyNo % 32] = key;


            });
            _.each(data.keys, function (key) {

              if (!keyObject[key.PageKeyNo]) {
                keyObject[key.PageKeyNo] = [];
              }
              keyObject[key.PageKeyNo][key.KeyNo % 32] = key;


            });
            return keyObject;
          }
          return {};
        });

      // DB.query("SELECT * FROM view_keyboard WHERE KeyboardLayoutMasterId = ?", [layoutId]).then(function (data) {
      //   keys = keys.concat(DB.fetchAll(data));
      //   deferred.resolve(keys);
      // });
      // return deferred.promise;
      };

      self.getKeysForPage = function (pageId) {
        return _.where(keys, {KeyboardPageId: pageId});
      };

      self.getPages = function (layoutId) {
        var deferred = $q.defer();
        DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.keyboard.pages + ' WHERE KeyboardLayoutMasterId = ?', [layoutId]).then(function (result) {
          pages = DB.fetchAll(result);

          deferred.resolve(pages);
        }, function (err) {
          deferred.reject(err.message);
        });
        return deferred.promise;
      };

      self.saveLayout = function (layouts) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.keyboard.layouts, layouts);
      };

      self.savePages = function (pages) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.keyboard.pages, pages);
      };

      self.savePageInfo = function (pageInfo) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.keyboard.pageInfo, pageInfo);
      };

      self.saveKeys = function (keys) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.keyboard.keys, keys);
      };

      var argbToRGB = function (color) {
        return color ? '#' + ('000000' + (color & 0xFFFFFF).toString(16)).slice(-6) : '';
      };


      return self;
    }]);
