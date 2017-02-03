/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory("ItemService", ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', 'LocationService', 'PriceGroupService',
    function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG, LocationService, PriceGroupService) {
    var self = this;

    var location = LocationService.currentLocation;
    if(!location){
      LocationService.get().then(function (loc) {
        location = loc;
      });
    }

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one("GetItemsByLocations").get({LocationId: SettingsService.getLocationId()}).then(function (res) {
          try {
            var items = JSON.parse(res);
          } catch(ex){
            deferred.reject("No results");
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
    }

    self.getItems = function () {
      var deferred = $q.defer();
      DB.query("SELECT * FROM " + DB_CONFIG.tableNames.item.item + "", []).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        deferred.reject(err.message);
      });
      return deferred.promise;
    }
    self.save = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.item.item, items);
    }

    self.get = function (plu, subPLU1, subPLU2, subPLU3) {
      var deferred = $q.defer();
      location = SettingsService.getLocationId();
      if(location){
        var query = "SELECT i.Id, i.Description1, i.Description2, PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount FROM Item AS i "
          +"INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id "
          +"INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id "
          +"INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id "
          +"WHERE i.PLU = ? AND s1.Code = ? AND s2.Code = ? AND s3.Code = ?";
        DB.query(query, [plu, subPLU1, subPLU2, subPLU3]).then(function (result) {
          var item = DB.fetch(result);
          if(item){
            self.getPrice(item.Plu, item.PriceGroupId, item.Taxable).then(function (data) {
              // item.Price = data ? data.data : 0;
              // item.PriceLevelId  = data ? data.PriceLevelId : 0;
              _.extend(item, data);
              deferred.resolve(item);
            }, function (err) {
              throw new Error(err.message);
              deferred.reject(err.message);
            });
          } else {
            deferred.reject("Item not found");
          }
        }, function (err) {
          throw new Error(err.message);
          deferred.reject(err.message);
        });
      } else {
        throw new Error("Invalid location");
        deferred.reject("Invalid location");
      }
      return deferred.promise;
    }

      self.getById = function (id) {
        var deferred = $q.defer();
        location = SettingsService.getLocationId();
        if(location){
          var query = "SELECT i.Id, i.Description1, i.Description2, PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount FROM Item AS i "
            +"INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id "
            +"INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id "
            +"INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id "
            +"WHERE i.Id = ?";
          DB.query(query, [id]).then(function (result) {
            var item = DB.fetch(result);
            if(item){
              self.getPrice(item.Plu, item.PriceGroupId, item.Taxable).then(function (data) {
                if(data){
                  _.extend(item, data);
                }
                // console.log('price');
                // console.log(item);
                // item.Price = data ? data.Price : 0;
                // item.PriceLevelId  = data ? data.PriceLevelId : 0;
                deferred.resolve(item);
              }, function (err) {
                console.log(err.message);
                deferred.reject(err.message);
              });
            } else {
              console.log("Item not found");
              deferred.reject("Item not found");
            }
          }, function (err) {
            console.log(err.message);
            deferred.reject(err.message);
          });
        } else {
          throw new Error("Invalid location");
          deferred.reject("Invalid location");
        }
        return deferred.promise;
      }

    self.getPrice = function (itemPlu, priceGroupId, taxable) {
      return LocationService.get().then(function (location) {
        return PriceGroupService.get(itemPlu, priceGroupId, location.PriceLevel, taxable).then(function (data) {
          // var item = {};
          // item.Price = data ? data.Price : 0;
          // item.PriceLevelId  = data ? data.PriceLevelId : 0;
          delete data.Id;
          return data;
        }
        // , function (err) {
        //   throw new Error(err.message);
        //   deferred.reject(err.message);
        // }
        );
      });
    }

    self.isDiscounted = function (item) {
      if(!item || !item.DiscAmount){
        return false;
      }
      return item.DiscAmount > 0;
    }

    self.calculateTotal = function (item) {
      if(item){
        item.Tax = item.Tax1Amount || 0 + item.Tax2Amount || 0 + item.Tax3Amount || 0 + item.Tax4Amount || 0 + item.Tax5Amount || 0;
        item.Discount = (item.DiscAmount + item.Tax1DiscAmount + item.Tax2DiscAmount + item.Tax3DiscAmount+ item.Tax4DiscAmount + item.Tax5DiscAmount).roundTo(2);
        item.Total = ((item.SubTotal + item.Tax) - item.Discount).roundTo(2);
        if (!item.Qty) {
          item.Qty = 0;
        }
      }
      return item;
    }

      self.isRefunded = function (item) {
        if(!item || !item.ReasonId){
          return false;
        }
        return true;
      }

    return self;
  }]);
