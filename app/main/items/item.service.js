/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory('ItemService', ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', 'LocationService', 'PriceGroupService', 'LogService',
    function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG, LocationService, PriceGroupService, LogService) {
      var self = this;
      var fetchedDate = 0;
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();

      var location = LocationService.currentLocation;
      if (!location) {
        LocationService.get().then(function (loc) {
          location = loc;
        });
      }

      self.fetch = function () {
        return $q.all({
          items: self.fetchItems(),
          barcodes: self.fetchBarcodes()
        });
      };

      self.fetchDate = function () {
        return DB.select(DB_CONFIG.tableNames.item.item, '*').then(function (res) {
          return DB.fetchAll(res);
        });
        // DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.item.item + '', []).then(function (result) {
        //   return DB.fetchAll(result);
        // })
      };

      self.fetchItems = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetItemsByLocations').get({LocationId: SettingsService.getLocationId()}).then(function (res) {
            try {
              items = JSON.parse(res);
              fetchedDate = items;
              syncLog.log('  GetItemsByLocations Sync Complete : ' + items.length + ' items found', 1);
            } catch (ex) {
              syncLog.log('  GetItemsByLocations Sync Fail : No results', 1);
              errorLog.log('GetItemsByLocations Sync Fail : No results');
              deferred.reject('No results');
            }
            if (items) {
              self.save(items);
              deferred.resolve();
            } else {
              syncLog.log('  GetItemsByLocations Sync Error : Unknown machine', 1);
              errorLog.log('GetItemsByLocations Sync Error : Unknown machine');
              deferred.reject('Unknown machine');
            }
          }, function (err) {
            console.error(err);
            syncLog.log('  GetItemsByLocations Sync Error : Unable to fetch data from the server', 1);
            errorLog.log('GetItemsByLocations Sync Error : Unable to fetch data from the server');
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          syncLog.log('  GetItemsByLocations Sync Fail : ' + ex, 1);
          errorLog.log('GetItemsByLocations Sync Fail : ' + ex);
          deferred.reject(ex);
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.fetchBarcodes = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetItemBarcode').get({LocationId: SettingsService.getLocationId()}).then(function (res) {
            try {
              if (!_.isUndefined(res)) {
                var barcodes = JSON.parse(res);
                if (barcodes) {
                  self.saveBarcodes(barcodes);
                  syncLog.log('  GetItemBarcode Sync Complete : ' + barcodes.length + ' items found', 1);
                  deferred.resolve();
                }
                else {
                  syncLog.log('  GetItemBarcode Sync Error : Unknown machine', 1);
                  errorLog.log('GetItemBarcode Sync Error : Unknown machine');
                  deferred.reject('Unknown machine');
                }
              }
              else {
                deferred.resolve();
              }
            } catch (ex) {
              syncLog.log('  GetItemBarcode Sync Fail : No results', 1);
              errorLog.log('GetItemBarcode Sync Fail : No results');
              deferred.reject('No results');
            }

          }, function (err) {
            console.error(err);
            syncLog.log('  GetItemBarcode Sync Error : Unable to fetch data from the server', 1);
            errorLog.log('GetItemBarcode Sync Error : Unable to fetch data from the server');
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          syncLog.log('  GetItemBarcode Sync Fail : ' + ex, 1);
          errorLog.log('GetItemBarcode Sync Fail : ' + ex);
          deferred.reject(ex);
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.getItems = function () {
        var deferred = $q.defer();
        DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.item.item + '', []).then(function (result) {
          deferred.resolve(DB.fetchAll(result));
        }, function (err) {
          errorLog.log('getItems Error : ' + err);
          deferred.reject(err.message);
        });
        LogService.SaveLog();
        return deferred.promise;
      };
      self.save = function (items) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.item.item, items);
      };

      self.saveBarcodes = function (barcodes) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.item.barcodes, barcodes);
      };

      self.get = function (plu, subPLU1, subPLU2, subPLU3) {
        var deferred = $q.defer();
        location = SettingsService.getLocationId();
        if (location) {
          var query = 'SELECT i.Id, i.Description1, i.Description2, PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount FROM Item AS i ' +
          'INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id ' +
          'INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id ' +
          'INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id ' +
          'WHERE i.PLU = ? AND s1.Code = ? AND s2.Code = ? AND s3.Code = ?';
          DB.query(query, [plu, subPLU1, subPLU2, subPLU3]).then(function (result) {
            var item = DB.fetch(result);
            if (item) {
              self.getPrice(item.Plu, item.PriceGroupId, item.Taxable).then(function (data) {
              // item.Price = data ? data.data : 0;
              // item.PriceLevelId  = data ? data.PriceLevelId : 0;
                _.extend(item, data);
                deferred.resolve(item);
              }, function (err) {
                errorLog.log('Item Error : ' + err.message);
                deferred.reject(err.message);
                throw new Error(err.message);
              });
            } else {
              errorLog.log('Item Status : Item not found');
              deferred.reject('Item not found');
            }
          }, function (err) {
            errorLog.log('Item Error : ' + err.message);
            deferred.reject(err.message);
            throw new Error(err.message);
          });
        } else {
          errorLog.log('Item Error : Invalid location');
          deferred.reject('Invalid location');
          throw new Error('Invalid location');
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.getById = function (id, type) {
        var deferred = $q.defer();
        location = SettingsService.getLocationId();
        if (location) {
          var query = 'SELECT i.Id, i.Description1, i.Description2, PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount FROM Item AS i ' +
            'INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id ' +
            'INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id ' +
            'INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id ' +
            'WHERE i.Id = ?';
          DB.query(query, [id]).then(function (result) {
            var item = DB.fetch(result);
            if (item) {
              self.getPrice(item.Plu, item.PriceGroupId, item.Taxable).then(function (data) {
                if (type != 0) {
                  if (data) {
                    _.extend(item, data);
                  }
                }
                // console.log('price');
                // console.log(item);
                // item.Price = data ? data.Price : 0;
                // item.PriceLevelId  = data ? data.PriceLevelId : 0;
                deferred.resolve(item);
              }, function (err) {
                errorLog.log('Item GetBy ID Error : ' + err.message, 4);
                console.log(err.message);
                deferred.reject(err.message);
              });
            } else {
              errorLog.log('Item GetBy ID Status : Item not found', 4);
              console.log('Item not found');
              deferred.reject('Item not found');
            }
          }, function (err) {
            errorLog.log('Item GetBy ID Error : ' + err.message, 4);
            console.log(err.message);
            deferred.reject(err.message);
          });
        } else {
          errorLog.log('Item GetBy ID Error : Invalid location', 4);
          deferred.reject('Invalid location');
          throw new Error('Invalid location');
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.getPrice = function (itemPlu, priceGroupId, taxable) {
        return LocationService.get().then(function (location) {
          return PriceGroupService.get(itemPlu, priceGroupId, location.PriceLevelId, taxable).then(function (data) {
            delete data.Id;
            return data;
          }
        // , function (err) {
        //   throw new Error(err.message);
        //   deferred.reject(err.message);
        // }
        );
        });
      };

      self.isDiscounted = function (item) {
        if (!item || !item.DiscAmount) {
          return false;
        }
        return item.DiscAmount > 0;
      };

      self.calculateTotal = function (item) {
        if (item) {
          item.Tax = (item.Tax1Amount || 0 + item.Tax2Amount || 0 + item.Tax3Amount || 0 + item.Tax4Amount || 0 + item.Tax5Amount || 0) - (item.Tax1DiscAmount + item.Tax2DiscAmount + item.Tax3DiscAmount + item.Tax4DiscAmount + item.Tax5DiscAmount);
          item.Tax = item.Tax.roundTo(2);
          item.Discount = (item.DiscAmount || 0).roundTo(2);

          item.Tax5DiscAmount = (item.Tax5DiscAmount || 0).roundTo(2);
          item.Total = ((item.SubTotal + item.Tax) - item.Discount).roundTo(2);
          if (!item.Qty) {
            item.Qty = 0;
          }
        }

        return item;
      };
      self.calculateTotalWithNoDisc = function (item) {
        if (item) {
        //item.Tax = (item.Tax1Amount || 0 + item.Tax2Amount || 0 + item.Tax3Amount || 0 + item.Tax4Amount || 0 + item.Tax5Amount || 0) - (item.Tax1DiscAmount + item.Tax2DiscAmount + item.Tax3DiscAmount+ item.Tax4DiscAmount + item.Tax5DiscAmount);
        //item.Discount = (item.DiscAmount||0).roundTo(2);
          item.Tax = (item.Tax1Amount || 0 + item.Tax2Amount || 0 + item.Tax3Amount || 0 + item.Tax4Amount || 0 + item.Tax5Amount || 0);
          item.Tax = item.Tax.roundTo(2);
          item.Tax5DiscAmount = (item.Tax5DiscAmount || 0).roundTo(2);
          item.Total = ((item.SubTotal + item.Tax)).roundTo(2);
          if (!item.Qty) {
            item.Qty = 0;
          }
        }
        return item;
      };

      self.isRefunded = function (item) {
        if (!item || !item.ReasonId) {
          return false;
        }
        return true;
      };

      self.getItemByBarcode = function (barcode) {
        var deferred = $q.defer();
        location = SettingsService.getLocationId();
        if (location) {
          var query = 'SELECT i.Id, i.Description1, i.Description2, PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount FROM Item AS i ' +
          'LEFT JOIN ItemBarcodes AS b ON i.Id = b.ItemId ' +
          'INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id ' +
          'INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id ' +
          'INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id ' +
          'WHERE b.Barcode = ?  OR Housebarcode = ? LIMIT 1';
          // var query = 'SELECT i.Id, i.Description1, i.Description2, PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount FROM Item AS i ' +
          //   'INNER JOIN ItemBarcodes AS b ON i.Id = b.ItemId ' +
          //   'INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id ' +
          //   'INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id ' +
          //   'INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id ' +
          //   'WHERE Housebarcode = ? OR b.Barcode = ? LIMIT 1';
          barcode = '' + barcode;
          // console.log(barcode);
          DB.query(query, [barcode, barcode]).then(function (result) {
            var item = DB.fetch(result);
            if (item) {
              self.getPrice(item.Plu, item.PriceGroupId, item.Taxable).then(function (data) {
                if (data) {
                  _.extend(item, data);
                }
                deferred.resolve(item);
              }, function (err) {
                errorLog.log('Item GetBy Barcode Error : ' + err.message, 4);
                console.log(err.message);
                deferred.reject(err.message);
              });
            } else {
              errorLog.log('Item GetBy Barcode Status : Item not found', 4);
              console.log('Item not found');
              deferred.reject('Item not found');
            }
          }, function (err) {
            errorLog.log('Item GetBy Barcode Error : ' + err.message, 4);
            console.log(err.message);
            deferred.reject(err.message);
          });
        } else {
          errorLog.log('Item GetBy Barcode Error : Invalid location', 4);
          deferred.reject('Invalid location');
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.getItemsByText = function (text) {
        var deferred = $q.defer();
        location = LocationService.currentLocation;
        if (location) {
          var query = 'SELECT i.Id, i.Description1, i.Description2, i.PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount, p.Price, p.StdCost, p.PriceLevelId, s1.Code AS SubPlu1, s2.Code AS SubPlu2, s3.Code AS SubPlu3 FROM Item AS i ' +
            'INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id ' +
            'INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id ' +
            'INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id ' +
            'INNER JOIN PriceGroups AS p ON i.Plu = p.Plu AND i.PriceGroupId = p.PriceGroupId ' +
            'WHERE (i.Plu = ? OR i.Description1 LIKE ? OR i.Description2 LIKE ?) AND p.PriceLevelId = ? GROUP BY i.Id';
          DB.query(query, [text, '%' + text + '%', '%' + text + '%', location.PriceLevelId]).then(function (result) {
            var items = DB.fetchAll(result);
            items = _.map(items, function (item) {
              item.OrgPrice = angular.copy(item.Price);
              if (item.Taxable == 'true') {
                if (location && location.Tax5Option == 3) {
                  item.Price = ((item.Price / (100 + location.Tax5Perc)) * 100).roundTo(2);
                }
              }
              return item;
            });
            deferred.resolve(items);
          }, function (err) {
            errorLog.log('Item GetBy Text Error : ' + err.message, 4);
            deferred.reject(err.message);
          });
        } else {
          errorLog.log('Item GetBy Text Error : Invalid location', 4);
          deferred.reject('Invalid location');
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      var strid, pinid, idlen;
      self.getItemById = function (id) {
        var itype = typeof id;
        if (itype == 'number') {
          strid = Math.floor(id);
        }
        // else {
        //   pinid = id.indexOf('-');
        //   idlen = id.length;
        //   strid = parseInt(id.substr(pinid + 1, idlen));
        // }

        var deferred = $q.defer();
        location = LocationService.currentLocation;
        if (location) {
          var query = 'SELECT i.Id, i.Description1, i.Description2, i.PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount, p.Price, p.StdCost, p.PriceLevelId, s1.Code AS SubPlu1, s2.Code AS SubPlu2, s3.Code AS SubPlu3 FROM Item AS i ' +
            'INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id ' +
            'INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id ' +
            'INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id ' +
            'INNER JOIN PriceGroups AS p ON i.Plu = p.Plu AND i.PriceGroupId = p.PriceGroupId ' +
            'WHERE i.Id = ? AND p.PriceLevelId = ? GROUP BY i.Id';
          // console.log(query);
          DB.query(query, [strid, location.PriceLevelId]).then(function (result) {
            var item = DB.fetch(result);
            item.OrgPrice = angular.copy(item.Price);
            if (item.Taxable == 'true') {
              if (location && location.Tax5Option == 3) {
                item.Price = ((item.Price / (100 + location.Tax5Perc)) * 100).roundTo(2);
              }
            }
            deferred.resolve(item);
          }, function (err) {
            errorLog.log('Item GetBy ID Error : ' + err.message, 4);
            deferred.reject(err.message);
          });
        } else {
          errorLog.log('Item GetBy ID Error : Invalid location', 4);
          deferred.reject('Invalid location');
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      return self;
    }]);
