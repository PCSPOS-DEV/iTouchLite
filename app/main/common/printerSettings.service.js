/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory('PrinterSettings', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG) {
    var self = this;
    var Pdata = {};
    self.currentLocation = $localStorage.location;
    var items;

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one('GetPrinterSettings').get({LocationId: SettingsService.getLocationId()}).then(function (res) {
          try {
            items = JSON.parse(res);
            angular.forEach(items, function (item) {
              if (!Pdata[item.Type]) {
                Pdata[item.Type] = {};
              }
              Pdata[item.Type][item.Sequence] = item;
            });
            console.log(Pdata);
          } catch (ex) {
            syncLog.log('  PrinterSettings Sync Error : ' + ex, 1);
            deferred.resolve([]);
          }
          if (items) {
            console.log(items);
            items = _.map(items, function (item) {
              return _.omit(item, 'LocationId');
            });
            self.save(items);
            syncLog.log('  PrinterSettings Sync Complete : ' + items.length + ' items found', 1);
            deferred.resolve(items);
          } else {
            syncLog.log('  PrinterSettings Sync Complete', 1);
            deferred.resolve([]);
          }
        }, function (err) {
          console.error(err);
          syncLog.log('  PrinterSettings Sync Error : Unable to fetch data from the server', 1);
          deferred.reject('Unable to fetch data from the server');
        });
      } catch (ex) {
        syncLog.log('  PrinterSettings Sync Error : ' + ex, 1);
        deferred.reject(ex);
      }

      return deferred.promise;
    };

    self.fetchData = function () {
      return Pdata;
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
        console.log(data);
        return data;
      });

    };

    self.save = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.config.printerSettings, items);
    };


    return self;
  }]);
