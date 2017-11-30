/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory('LocationService', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG) {
    var self = this;
    self.currentLocation = $localStorage.location;

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one('GetLocations').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
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

    self.get = function () {
      var locationPromise;
      if (self.currentLocation && self.currentLocation.Id == SettingsService.getLocationId()) {
        locationPromise = $q.when(self.currentLocation);
      } else {
        locationPromise = DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.locations.locations + ' WHERE Id = ?', [SettingsService.getLocationId()]).then(function (result) {
          var loc = DB.fetch(result);
          if (loc) {
            self.currentLocation = loc;
            $localStorage.location = loc;
            return self.currentLocation;
          } else {
            return $q.reject('Invalid Location Id');
          }
        });
      }
      return locationPromise.then(function (location) {
        renameProperty(location, 'PriceLevel', 'PriceLevelId');
        renameProperty(location, 'Id', 'LocationId');
        return location;
      });
    };

    self.save = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.locations.locations, items);
    };


    return self;
  }]);
