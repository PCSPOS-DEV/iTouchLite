/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory('DaysService', ['ErrorService', 'DB', 'DB_CONFIG', 'SettingsService', '$q', 'Restangular',
    function (ErrorService, DB, DB_CONFIG, SettingsService, $q, Restangular) {
      var self = this;

      self.fetch = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetPromotionDays').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            var items = JSON.parse(res);
            if (items) {
              self.save(items);
              deferred.resolve();
            } else {
              deferred.reject('Unable to fetch Promotion days');
            }

          }, function (err) {
            throw new Error(err);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          deferred.reject(ex);
        }

        return deferred.promise;
      };

      self.save = function (items) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.promo.days, items);
      };

      return self;
    }]);
