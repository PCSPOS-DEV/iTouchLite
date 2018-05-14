/**
 * Created by shalitha on 18/5/16.
 */
'use strict';
angular.module('itouch.services')
  .factory('SubPLU1Service', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG) {
    var self = this;
    syncLog = SettingsService.StartSyncLog();

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one('GetSubPLU1').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
          try {
            var items = JSON.parse(res);
          } catch (ex) {
            syncLog.log('  SubPLU1 Sync Fail : No results', 1);
            deferred.reject('No results');
          }
          if (items) {
            self.save(items);
            syncLog.log('  SubPLU1 Sync Complete : ' + items.length + ' items found', 1);
            deferred.resolve(items);
          } else {
            syncLog.log('  SubPLU1 Sync Error : Unknown machine', 1);
            deferred.reject('Unknown machine');
          }
        }, function (err) {
          console.error(err);
          syncLog.log('  SubPLU1 Sync Error : Unable to fetch data from the server', 1);
          deferred.reject('Unable to fetch data from the server');
        });
      } catch (ex) {
        deferred.reject(ex);
      }

      return deferred.promise;
    };

    self.get = function (code) {
      var deferred = $q.defer();
      DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.item.subPLU1 + ' WHERE Code = ?', [code]).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        deferred.reject(err.message);
      });
      return deferred.promise;
    };

    self.getAvailable = function (plu) {
      var deferred = $q.defer();
      DB.query('SELECT s.Code, s.Id, s.Description1 FROM ' + DB_CONFIG.tableNames.item.item + ' as i INNER JOIN ' + DB_CONFIG.tableNames.item.subPLU1 + ' as s ON i.SubPLU1Id = s.Id WHERE PLU = ?;', [plu]).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        deferred.reject(err.message);
      });
      return deferred.promise;
    };

    self.save = function (subPLU) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.item.subPLU1, subPLU);
    };


    return self;
  }]);
