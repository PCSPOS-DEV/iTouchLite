/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory('DaysService', ['ErrorService', 'DB', 'DB_CONFIG', 'SettingsService', '$q', 'Restangular', 'LogService',
    function (ErrorService, DB, DB_CONFIG, SettingsService, $q, Restangular, LogService) {
      var self = this;
      syncLog = SettingsService.StartSyncLog();
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();

      self.fetch = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetPromotionDays').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            var items = JSON.parse(res);
            if (items) {
              self.save(items);
              syncLog.log('  PromotionDays Sync Complete : ' + items.length + ' items found', 1);
              deferred.resolve();
            } else {
              syncLog.log('  PromotionDays Sync Error : Unable to fetch Promotion days', 1);
              eventLog.log('PromotionDays Sync Error : Unable to fetch Promotion days');
              deferred.reject('Unable to fetch Promotion days');
            }

          }, function (err) {
            syncLog.log('  PromotionDays Sync Error : Unable to fetch data from the server', 1);
            eventLog.log('PromotionDays Sync Error : Unable to fetch data from the server');
            deferred.reject('Unable to fetch data from the server');
            throw new Error(err);

          });
        } catch (ex) {
          syncLog.log('  PromotionDays Sync Error : ' + ex, 1);
          eventLog.log('PromotionDays Sync Error : ' + ex);
          deferred.reject(ex);
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.save = function (items) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.promo.days, items);
      };

      return self;
    }]);
