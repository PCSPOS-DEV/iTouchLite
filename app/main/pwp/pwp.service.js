/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
.factory("PWPService", ['LocationService', 'DB', 'DB_CONFIG', '$q', '$localStorage', 'Restangular', 'SettingsService', 'ControlService',
  function (LocationService, DB, DB_CONFIG, $q, $localStorage, Restangular, SettingsService, ControlService) {
  var self = this;

  self.fetchItemsByPWP = function () {
    var deferred = $q.defer();
      Restangular.one("GetItemsByPwp").get({EntityId: SettingsService.getEntityId()}).then(function (res) {
        try {
          var items = JSON.parse(res);
        } catch(ex){
          deferred.reject("No results");
        }
        if (items) {
          self.saveItemsByPWP(items);
          deferred.resolve();
        } else {
          deferred.reject('Unknown machine');
        }
      }, function (err) {
        console.error(err);
        deferred.reject('Unable to fetch data from the server');
      });

    return deferred.promise;
  }

  self.fetchPWP = function () {
    var deferred = $q.defer();
    Restangular.one("GetPwp").get({EntityId: SettingsService.getEntityId()}).then(function (res) {
      try {
        var items = JSON.parse(res);
        items = _.map(items, function(item){
          return _.omit(item, 'EntityId');
        });
      } catch(ex){
        deferred.reject("No results");
      }
      if (items) {
        console.log(items);
        self.savePWP(items);
        deferred.resolve();
      } else {
        deferred.reject('Unknown machine');
      }
    }, function (err) {
      console.error(err);
      deferred.reject('Unable to fetch data from the server');
    });

    return deferred.promise;
  }

  self.saveItemsByPWP = function (items) {
    DB.addInsertToQueue(DB_CONFIG.tableNames.pwp.itemsByPwp, items);
  }

  self.savePWP = function (items) {
    DB.addInsertToQueue(DB_CONFIG.tableNames.pwp.pwp, items);
  }
//TODO: business date validation
  self.getPWP = function (itemId) {
    var deferred = $q.defer();
    var businessDate = ControlService.getBusinessDate(true);
    var query = "SELECT " +
      "p.Id, Code, p.Description1, p.Description2, PriceLevelId, FromDate, ToDate, Quantity, p.MaxQuantity, p.MaxPrice, p.itemId, " +
      "i.ItemId AS SubItemId, i.MaxQuantity AS SubItemMaxQty, i.Price AS SubItemPrice, i.DiscountId, " +
      " it.Description1 AS ItemDesc1, it.Description2 AS ItemDesc2, it.PriceGroupId, it.Plu FROM " +
      DB_CONFIG.tableNames.pwp.pwp + " AS p LEFT OUTER JOIN " +
      DB_CONFIG.tableNames.pwp.itemsByPwp + " AS i ON p.Id = i.PwpId  LEFT OUTER JOIN " +
      DB_CONFIG.tableNames.item.item + " AS it ON i.ItemId = it.Id"
    +" WHERE IsMultiItemPromotion = 'false' "
    + " AND p.ItemId = ?";
    // + " AND FromDate > ? AND ToDate < ?";

    DB.query(query, [itemId]).then(function (result) {
      var resultSet =  DB.fetchAll(result);
      // console.log(resultSet);
      var pwp = null;
      if(resultSet.length > 0){
        pwp = _.pick(_.first(resultSet), ['Id', 'Code', 'Description1', 'Description2', 'FromDate', 'ToDate', 'Quantity', 'ItemId', 'MaxQuantity', 'MaxPrice', 'PriceLevelId']);
        pwp.items = _.map(resultSet, function(row){
          return _.pick(row, ['SubItemId', 'MaxQuantity', 'SubItemMaxQty', 'SubItemPrice','DiscountId', 'ItemDesc1', 'ItemDesc2', 'PriceGroupId', 'Plu', 'DiscountId']);
        });
      }
      deferred.resolve(pwp);
    }, function (err) {
      deferred.reject(err.message);
    });
    return deferred.promise;
  }

  return self;
}]);
