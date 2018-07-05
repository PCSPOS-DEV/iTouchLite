/**
 * Created by shalitha on 18/5/16.
 */

angular.module('itouch.services')
  .factory('DepartmentService', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', 'LogService', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG, LogService) {
    var self = this;
    eventLog = LogService.StartEventLog();
    errorLog = LogService.StartErrorLog();

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one('GetDepartments').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
          try {
            items = JSON.parse(res);
          } catch (ex) {
            syncLog.log('  Departments Sync Error : No results', 1);
            errorLog.log('Departments Sync Error : No results');
            deferred.reject('No results');
          }
          if (items) {
            self.save(items);
            syncLog.log('  Departments Sync Complete : ' + items.length + ' items found', 1);
            deferred.resolve(items);
          } else {
            syncLog.log('  Departments Sync Error : Unknown machine', 1);
            errorLog.log('Departments Sync Error : Unknown machine');
            deferred.reject('Unknown machine');
          }
        }, function (err) {
          console.error(err);
          syncLog.log('  Departments Sync Error : Unable to fetch data from the server', 1);
          errorLog.log('Departments Sync Error : Unable to fetch data from the server');
          deferred.reject('Unable to fetch data from the server');
        });
      } catch (ex) {
        syncLog.log('  Departments Sync Error : ' + ex, 1);
        errorLog.log('Departments Sync Error : ' + ex);
        deferred.reject(ex);
      }
      LogService.SaveLog();
      return deferred.promise;
    };

    self.get = function (code) {
      var deferred = $q.defer();
      DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.item.departments + ' WHERE Code = ?', [code]).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        errorLog.log('Departments Service Error : ' + err.message, 4);
        LogService.SaveLog();
        deferred.reject(err.message);
      });
      return deferred.promise;
    };

    self.save = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.item.departments, items);
    };


    return self;
  }]);
