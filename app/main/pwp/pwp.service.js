/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
.factory('PWPService', ['LocationService', 'DB', 'DB_CONFIG', '$q', '$localStorage', 'Restangular', 'SettingsService', 'ControlService', 'Alert', 'LogService',
  function (LocationService, DB, DB_CONFIG, $q, $localStorage, Restangular, SettingsService, ControlService, Alert, LogService) {
    var self = this;
    var type = 0;
    eventLog = LogService.StartEventLog();
    errorLog = LogService.StartErrorLog();
    self.fetchItemsByPWP = function () {
      var deferred = $q.defer();
      Restangular.one('GetItemsByPwp').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
        try {
          if (!_.isUndefined(res)) {
            var items = JSON.parse(res);
            if (items) {
              self.saveItemsByPWP(items);
              syncLog.log('  ItemsByPWP Sync Complete : ' + items.length + ' items found', 1);
              deferred.resolve();
            }
            else {
              syncLog.log('  ItemsByPWP Sync Error : Unknown machine', 1);
              errorLog.log('ItemsByPWP Sync Error : Unknown machine');
              deferred.reject('Unknown machine');
            }
          }
          else {
            syncLog.log('  ItemsByPWP Sync Complete', 1);
            deferred.resolve();
          }
        } catch (ex) {
          syncLog.log('  ItemsByPWP Sync Error : No results', 1);
          errorLog.log('ItemsByPWP Sync Error : No results');
          deferred.reject('No results');
        }
      }, function (err) {
        console.error(err);
        syncLog.log('  ItemsByPWP Sync Error : Unable to fetch data from the server', 1);
        errorLog.log('ItemsByPWP Sync Error : Unable to fetch data from the server');
        deferred.reject('Unable to fetch data from the server');
      });
      LogService.SaveLog();
      return deferred.promise;
    };

    self.fetchPWP = function () {
      var deferred = $q.defer();
      Restangular.one('GetPwp').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
        try {
          if (!_.isUndefined(res)) {
            var items = JSON.parse(res);
            items = _.map(items, function (item) {
              return _.omit(item, 'EntityId');
            });
            if (items) {
              self.savePWP(items);
              syncLog.log('  PWP Sync Complete : ' + items.length + ' items found', 1);
              deferred.resolve();
            } else {
              syncLog.log('  PWP Sync Error : Unknown machine', 1);
              errorLog.log('PWP Sync Error : Unknown machine');
              deferred.reject('Unknown machine');
            }
          }
          else
          {
            syncLog.log('  PWP Sync Complete', 1);
            deferred.resolve();
          }
        } catch (ex) {
          syncLog.log('  PWP Sync Error : No results', 1);
          errorLog.log('PWP Sync Error : No results');
          deferred.reject('No results');
        }
      }, function (err) {
        console.error(err);
        syncLog.log('  PWP Sync Error : Unable to fetch data from the server', 1);
        errorLog.log('PWP Sync Error : Unable to fetch data from the server');
        deferred.reject('Unable to fetch data from the server');
      });
      LogService.SaveLog();
      return deferred.promise;
    };

    self.saveItemsByPWP = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.pwp.itemsByPwp, items);
    };

    self.savePWP = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.pwp.pwp, items);
    };
    self.getPWP = function (item, qty) {
      var deferred = $q.defer();
      var businessDate = moment(ControlService.getBusinessDate(true)).format('YYYY-MM-DDT00:00:00');
      var query = 'SELECT ' +
      'p.Id, Code, p.Description1, p.Description2, PriceLevelId, FromDate, ToDate, Quantity, p.MaxQuantity, p.MaxPrice, p.itemId, p.MaxNoOfItems, p.MaxNoOfItemsPerReceipt,' +
      'i.ItemId AS SubItemId, i.MaxQuantity AS SubItemMaxQty, i.Price AS SubItemPrice, i.DiscountId, ' +
      ' it.Description1 AS ItemDesc1, it.Description2 AS ItemDesc2, it.PriceGroupId, it.Plu FROM ' +
      DB_CONFIG.tableNames.pwp.pwp + ' AS p LEFT OUTER JOIN ' +
      DB_CONFIG.tableNames.pwp.itemsByPwp + ' AS i ON p.Id = i.PwpId  LEFT OUTER JOIN ' +
      DB_CONFIG.tableNames.item.item + ' AS it ON i.ItemId = it.Id' +
    ' WHERE IsMultiItemPromotion = \'false\' ' +
    ' AND p.ItemId = ?';
    //  AND FromDate < ? AND ToDate > ?';

      DB.query(query, [item.Id]).then(function (result) {
        var resultSet =  DB.fetchAll(result);
        // console.log(resultSet);
        // console.log(resultSet.length);
        // console.log(type);
        var pwp = null;
        if (resultSet.length > 0 ) {
          type = 1;
          var RFromDate = resultSet[0].FromDate;
          var RToDate = resultSet[0].ToDate;
          console.log('RFromDate : ' + RFromDate);
          console.log('RToDate : ' + RToDate);
          console.log('businessDate : ' + businessDate);
          if (RFromDate <= businessDate && businessDate <= RToDate) {
            eventLog.log('Pass Promotion Date ');
            var MaxItemsPerReceipt = resultSet[0].MaxNoOfItemsPerReceipt;
            pwp = _.pick(_.first(resultSet), ['Id', 'Code', 'Description1', 'Description2', 'FromDate', 'ToDate', 'Quantity', 'ItemId', 'MaxQuantity', 'MaxPrice', 'PriceLevelId']);
            if (qty > MaxItemsPerReceipt && MaxItemsPerReceipt < 0) {
              pwp.QtyEntered = MaxItemsPerReceipt;
            } else {
              pwp.QtyEntered = qty;
            }
            var applicableQty = Math.floor(pwp.QtyEntered / pwp.Quantity);
            // Bug fix for applicableQty = NaN prevent PWP panel open.
            // By Lynn Naing Zaw - 7/12/2017
            if (isNaN(applicableQty)) {
              applicableQty = 1;
            }
            // pwp.QtyEntered = qty;

            if (pwp.QtyEntered == undefined) {
              pwp.QtyEntered = 1;
            }
            /** */

            pwp.selectedItems = {};
            pwp.item = item;
            pwp.TotalChildQty = pwp.MaxQuantity * applicableQty;
            pwp.SuggestedQty = pwp.Quantity * applicableQty;
            pwp.MaxPrice = pwp.MaxPrice * applicableQty;
            // pwp.TotalChildQty = pwp.MaxQuantity * applicableQty;
            // pwp.QtyEntered = qty;
            pwp.Qty = 0;

            pwp.items = _.map(resultSet, function (row) {
              var item = _.pick(row, ['SubItemId', 'MaxQuantity', 'SubItemMaxQty', 'SubItemPrice', 'DiscountId', 'ItemDesc1', 'ItemDesc2', 'PriceGroupId', 'Plu', 'DiscountId']);
              item.SubItemMaxQty = item.SubItemMaxQty * applicableQty;
              return item;
            });
            eventLog.log('selectItem PWP Done ');
            deferred.resolve(pwp);
          } else {
            eventLog.log('Fail Promotion Date ');
            // Alert.error('Expire promotion period');
            console.log('Expire promotion period');
            var expire = 'expire';

            deferred.resolve(pwp, expire);
          }
        } else {
          type = 0;
          if (type == 0) {
            deferred.resolve(pwp);
          }
        }

      }, function (err) {
        errorLog.log('getPWP Error : ' +  err.message);
        deferred.reject(err.message);
      });
      return deferred.promise;
    };

    var getApplicableQty = function (max, entered, qty) {
      var times = Math.floor(entered / qty);
      // console.log(times);
      return max * times;
    };

    return self;
  }]);
