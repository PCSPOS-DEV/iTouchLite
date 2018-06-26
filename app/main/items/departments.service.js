/**
 * Created by shalitha on 18/5/16.
 */

angular.module('itouch.services')
  .factory('DepartmentService', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG) {
    var self = this;
    errorLog = SettingsService.StartErrorLog();

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one('GetDepartments').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
          try {
            var items = JSON.parse(res);
          } catch (ex) {
            syncLog.log('  Departments Sync Error : No results', 1);
            deferred.reject('No results');
          }
          if (items) {
            self.save(items);
            syncLog.log('  Departments Sync Complete : ' + items.length + ' items found', 1);
            deferred.resolve(items);
          } else {
            syncLog.log('  Departments Sync Error : Unknown machine', 1);
            deferred.reject('Unknown machine');
          }
        }, function (err) {
          console.error(err);
          syncLog.log('  Departments Sync Error : Unable to fetch data from the server', 1);
          deferred.reject('Unable to fetch data from the server');
        });
      } catch (ex) {
        syncLog.log('  Departments Sync Error : ' + ex, 1);
        deferred.reject(ex);
      }

      return deferred.promise;
    };

    self.get = function (code) {
      var deferred = $q.defer();
      DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.item.departments + ' WHERE Code = ?', [code]).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        errorLog.log('Departments Service Error : '+ err.message, 4);
        deferred.reject(err.message);
      });
      return deferred.promise;
    };

    self.save = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.item.departments, items);
    };


    return self;
  }]);
