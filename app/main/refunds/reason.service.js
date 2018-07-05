/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory('ReasonService', ['ErrorService', 'DB', 'DB_CONFIG', 'SettingsService', '$q', 'Restangular', '$localStorage', 'AuthService',
    function (ErrorService, DB, DB_CONFIG, SettingsService, $q, Restangular, $localStorage, AuthService) {
      var self = this;

      self.fetch = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetReason').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            if (res && res != '') {
              var items = JSON.parse(res);
              if (items) {
                items = _.map(items, function (item) {
                  return _.omit(item, 'EntityId');
                });
                self.save(items);
                syncLog.log('  Reasons Sync Complete : ' + items.length + ' reasons found', 1);
                deferred.resolve();
              } else {
                syncLog.log('  Reasons Sync Error : Unable to fetch Shifts', 1);
                deferred.reject('Unable to fetch Shifts');
              }
            } else {
              syncLog.log('  Reasons Sync Error : Unable to fetch Shifts', 1);
              deferred.reject('Unable to fetch Shifts');
            }

          }, function (err) {
            syncLog.log('  Reasons Sync Error : Unable to fetch data from the server', 1);
            deferred.reject('Unable to fetch data from the server');
            throw new Error(err);
          });
        } catch (ex) {
          syncLog.log('  Reasons Sync Error : ' + ex, 1);
          deferred.reject(ex);
        }

        return deferred.promise;
      };

      self.save = function (items) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.refunds.reasons, items);
      };

      self.get = function (type) {
        var deferred = $q.defer();
        DB.select(DB_CONFIG.tableNames.refunds.reasons, '*', { columns: 'Type=?', data: [type]}).then(function (data) {
          deferred.resolve(DB.fetchAll(data));
        }, function (ex) {
          deferred.reject(ex.message);
          throw new Error(ex.message);
        });
        return deferred.promise;
      };

      return self;
    }]);
