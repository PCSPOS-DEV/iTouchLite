/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory('DaysService', ['ErrorService', 'DB', 'DB_CONFIG', 'SettingsService', '$q', 'Restangular',
    function (ErrorService, DB, DB_CONFIG, SettingsService, $q, Restangular) {
      var self = this;
      syncLog = SettingsService.StartSyncLog();

      self.fetch = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetPromotionDays').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            var items = JSON.parse(res);
            if (items) {
              console.log(items);
              self.save(items);
              syncLog.log('  PromotionDays Sync Complete : ' + items.length + ' items found', 1);
              deferred.resolve();
            } else {
              syncLog.log('  PromotionDays Sync Error : Unable to fetch Promotion days', 1);
              deferred.reject('Unable to fetch Promotion days');
            }

          }, function (err) {
            throw new Error(err);
            syncLog.log('  PromotionDays Sync Error : Unable to fetch data from the server', 1);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          syncLog.log('  PromotionDays Sync Error : ' + ex, 1);
          deferred.reject(ex);
        }

        return deferred.promise;
      };

      self.save = function (items) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.promo.days, items);
      };

      return self;
    }]);
