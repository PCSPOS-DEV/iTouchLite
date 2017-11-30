/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory('PrinterSettings', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG) {
    var self = this;
    self.currentLocation = $localStorage.location;

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one('GetPrinterSettings').get({LocationId: SettingsService.getLocationId()}).then(function (res) {
          try {
            var items = JSON.parse(res);
          } catch (ex) {
            deferred.resolve([]);
          }
          if (items) {
            console.log(items);
            items = _.map(items, function (item) {
              return _.omit(item, 'LocationId');
            });
            self.save(items);
            deferred.resolve(items);
          } else {
            deferred.resolve([]);
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

    self.get = function () {
      return DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.config.printerSettings).then(function (result) {
        result = DB.fetchAll(result);
        var data = {};
        angular.forEach(result, function (item) {
          if (!data[item.Type]) {
            data[item.Type] = {};
          }
          data[item.Type][item.Sequence] = item;
        });
        return data;
      });

    };

    self.save = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.config.printerSettings, items);
    };


    return self;
  }]);
