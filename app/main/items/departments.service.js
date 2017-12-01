/**
 * Created by shalitha on 18/5/16.
 */
'use strict';
angular.module('itouch.services')
  .factory('DepartmentService', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG) {
    var self = this;

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one('GetDepartments').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
          try {
            var items = JSON.parse(res);
          } catch (ex) {
            deferred.reject('No results');
          }
          if (items) {
            self.save(items);
            deferred.resolve(items);
          } else {
            deferred.reject('Unknown machine');
          }
        }, function (err) {
          console.error(err);
          deferred.reject('Unable to fetch data from the server');
        });
      } catch (ex) {
        deferred.reject(ex);
      }

      return deferred.promise;
    };

    self.get = function (code) {
      var deferred = $q.defer();
      DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.item.departments + ' WHERE Code = ?', [code]).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        deferred.reject(err.message);
      });
      return deferred.promise;
    };

    self.save = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.item.departments, items);
    };


    return self;
  }]);
