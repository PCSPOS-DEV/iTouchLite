/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory('PriceGroupService', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', 'LocationService', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG, LocationService) {
    var self = this;

    var location = LocationService.currentLocation;
    renameProperty(location, 'PriceLevel', 'PriceLevelId');
    renameProperty(location, 'Id', 'LocationId');
    if (!location) {
      LocationService.get().then(function (loc) {
        location = loc;
        renameProperty(location, 'PriceLevel', 'PriceLevelId');
        renameProperty(location, 'Id', 'LocationId');
      });
    }

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one('GetItemPriceByPriceGroupLevel').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
          try {
            var items = JSON.parse(res);
          } catch (ex) {
            deferred.reject('No results');
          }
          if (items) {
            self.save(items);
            deferred.resolve();
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

    self.get = function (plu, priceGroupId, priceLevel, taxable) {
      location = LocationService.currentLocation;
      return DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.item.priceGroups + ' WHERE  PLU = ? AND PriceGroupId = ? AND PriceLevelId = ?', [plu, priceGroupId, priceLevel]).then(function (result) {
        var data = DB.fetch(result);
        if (data) {
          // console.log(data);
          data.OrgPrice = data.OrgPrice || data.Price;
          data.AlteredPrice = data.AlteredPrice || data.Price;
          data.StdCost = data.StdCost;
          data.Price = data.Price;
          if (taxable) {
            if (location && location.Tax5Option == 3) {
              data.Price = ((data.Price / (100 + location.Tax5Perc)) * 100).roundTo(2);
            }
          }
          return data;
        } else {
          return {
            Price: 0,
            OrgPrice: 0,
            AlteredPrice: 0,
            PriceLevelId: priceLevel
          };
        }
      });
    };


    self.save = function (priceGroups) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.item.priceGroups, priceGroups);
    };


    return self;
  }]);
