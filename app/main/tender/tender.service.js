/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
.factory('TenderService', ['LocationService', 'DB', 'DB_CONFIG', '$q', '$localStorage', 'Restangular', 'SettingsService', 'ControlService', function (LocationService, DB, DB_CONFIG, $q, $localStorage, Restangular, SettingsService, ControlService) {
  var self = this;

  self.fetchTenderTypes = function () {
    var deferred = $q.defer();
    Restangular.one('GetTenderTypesByLocations').get({LocationId: SettingsService.getLocationId()}).then(function (res) {
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

    return deferred.promise;
  };

  self.getTenderTypes = function () {
    var deferred = $q.defer();
    DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.bill.tenderTypes + '', []).then(function (result) {
      deferred.resolve(DB.fetchAll(result));
    }, function (err) {
      deferred.reject(err.message);
    });
    return deferred.promise;
  };

  self.getTenderTypeById = function (Id) {
    return DB.select(DB_CONFIG.tableNames.bill.tenderTypes, '*', { columns: 'Id = ?', data: [Id] }).then(function (result) {
      return DB.fetch(result);
    });
  };

  self.save = function (items) {
    DB.addInsertToQueue(DB_CONFIG.tableNames.bill.tenderTypes, items);
  };

  /**
   * Returns the doc type
   * @returns {string}
     */
  // TODO: implement doctype constants and code to retrieve correct doc type
  self.getDocType = function () {
    return 'SA';
  };

  return self;
}]);
