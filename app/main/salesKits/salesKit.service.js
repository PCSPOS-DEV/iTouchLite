/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory('SalesKitService', ['ErrorService', 'DB', 'DB_CONFIG', 'SettingsService', '$q', 'Restangular', 'ItemService', 'LocationService', 'AuthService', '$filter', 'ControlService', 'TenderService', 'BillService', 'LogService',
    function (ErrorService, DB, DB_CONFIG, SettingsService, $q, Restangular, ItemService, LocationService, AuthService, $filter, ControlService, TenderService, BillService, LogService) {
      var self = this;
      syncLog = SettingsService.StartSyncLog();
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();

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
        return $q.all([self.fetchKitApplicablePeriod(), self.fetchKitByDays(), self.fetchKitItems(), self.fetchSalesKitSelections()]);
      };

      self.fetchKitApplicablePeriod = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetSalesKitApplicablePeriod').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            if (!_.isUndefined(res)) {
              var items = JSON.parse(res);
              if (items) {
                self.saveKitApplicablePeriod(items);
                syncLog.log('  SalesKits Sync Complete', 1);
                deferred.resolve();
              } else {
                syncLog.log('  SalesKits Sync Fail : Unable to fetch sales kits', 1);
                errorLog.log('SalesKits Sync Fail : Unable to fetch sales kits');
                deferred.reject('Unable to fetch sales kits');
              }
            }
            else {
              deferred.resolve();
            }
          }, function (err) {
            console.error(err);
            syncLog.log('  SalesKits Sync Error : Unable to fetch data from the server', 1);
            errorLog.log('SalesKits Sync Error : Unable to fetch data from the server');
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          syncLog.log('  SalesKits Sync Error : ' + ex, 1);
          errorLog.log('SalesKits Sync Error : ' + ex);
          deferred.reject(ex);
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.saveKitApplicablePeriod = function (salesKits) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.salesKit.salesKitApplicablePeriod, salesKits);
      };

      self.fetchKitByDays = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetSalesKitByDays').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            if (!_.isUndefined(res)) {
              var items = JSON.parse(res);
              if (items) {
                self.saveKitByDays(items);
                deferred.resolve();
              } else {
                errorLog.log('SalesKits fetchKitByDays Error : Unable to fetch sales kits', 4);
                deferred.reject('Unable to fetch sales kits');
              }
            }
            else {
              deferred.resolve();
            }
          }, function (err) {
            console.error(err);
            errorLog.log('SalesKits fetchKitByDays Error : Unable to fetch data from the server', 4);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          deferred.reject(ex);
          errorLog.log('SalesKits fetchKitByDays Error' + ex);
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.saveKitByDays = function (salesKits) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.salesKit.salesKitByDays, salesKits);
      };

      self.fetchKitItems = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetSalesKitItems').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            if (!_.isUndefined(res)) {
              var items = JSON.parse(res);
              if (items) {
                self.saveKitItems(items);
                deferred.resolve();
              } else {
                errorLog.log('SalesKits fetchKitItems Error : Unable to fetch sales kits');
                deferred.reject('Unable to fetch sales kits');
              }
            }
            else {
              deferred.resolve();
            }
          }, function (err) {
            console.error(err);
            errorLog.log('SalesKits fetchKitItems Error : Unable to fetch data from the server');
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          errorLog.log('SalesKits fetchKitItems Error' + ex);
          deferred.reject(ex);
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.saveKitItems = function (salesKits) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.salesKit.salesKitItems, salesKits);
      };

      self.fetchSalesKitSelections = function () {
        var deferred = $q.defer();
        try {
          Restangular.one('GetSalesKitSelections').get({EntityId: SettingsService.getEntityId()}).then(function (res) {
            if (!_.isUndefined(res)) {
              var items = JSON.parse(res);
              if (items) {
                self.saveSalesKitSelections(items);
                deferred.resolve();
              } else {
                errorLog.log('SalesKits fetchSalesKitSelections Error : Unable to fetch sales kits');
                deferred.reject('Unable to fetch sales kits');
              }
            }
            else {
              deferred.resolve();
            }
          }, function (err) {
            console.error(err);
            errorLog.log('SalesKits fetchSalesKitSelections Error : Unable to fetch data from the server');
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          deferred.reject(ex);
          errorLog.log('SalesKits fetchSalesKitSelections Error' + ex);
        }
        LogService.SaveLog();
        return deferred.promise;
      };

      self.saveSalesKitSelections = function (salesKits) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.salesKit.salesKitSelections, salesKits);
      };

      self.getSalesKit = function (itemId, BusinessDate) {
        // eventLog.log('Retrieve Salekit Data Start ');
        var salesKit;
        var q = 'SELECT *, sk.Id AS SaleKitItemsId FROM ' + DB_CONFIG.tableNames.salesKit.salesKitItems + ' AS sk  INNER JOIN ' +
          DB_CONFIG.tableNames.item.item + ' AS i ON i.Id = sk.ItemId  WHERE sk.SalesKitId = ?';

        return DB.query(q, [itemId]).then(function (res) {
          var salesKitItems = DB.fetchAll(res);

          return ItemService.getById(itemId).then(function (sk) {
            salesKit = sk;
            if (salesKitItems.length > 0) {
              var promises = [];
              salesKit.component = {};
              /*Yi Yi Po*/
              salesKitItems.sort(function (b, a) {
                return a.Id - b.Id;
              });
              angular.forEach(salesKitItems, function (ski) {
                salesKit.selected = angular.copy(ski);
                ski.SalesKitId = itemId;
                salesKit.list = {};
                salesKit.selectedList = {};

                promises.push(DB.select(DB_CONFIG.tableNames.salesKit.salesKitSelections + ' AS sks INNER JOIN ' + DB_CONFIG.tableNames.item.item + ' AS i ON i.Id = sks.SelectionId', '*, i.Id AS ItemId', { columns: 'SalesKitItemsId = ? AND Quantity>?', data: [ski.SaleKitItemsId, 0]})
                    .then(function (res) {
                      var selections = _.map(DB.fetchAll(res), function (row) {
                        row.SalesKitId = itemId;
                        row.Qty = 0;
                        row.Default = false;
                        row.Selectable = true;
                        return row;
                      });
                      // console.log(salesKit.selected.Id); // GGWP
                      if (selections.length > 0)
                      {
                        ski.Selections = selections;
                        ski.Selected = true;
                        ski.Qty = 0;
                        ski.Selectable = true;
                        selections.unshift(ski);
                        salesKit.selected.Selections = selections;
                        salesKit.component[ski.ItemId] = ski;
                      } else {
                        ski.Qty = ski.Quantity;
                        ski.Quantity = ski.Quantity;
                        ski.Selected = true;
                        ski.Default = true;
                        ski.Selectable = false;
                        salesKit.selectedList[ski.ItemId] = ski;
                      }
                      angular.forEach(selections, function (skisl) {
                        if (skisl.SalesKitItemsId != undefined) {
                          skisl.ItemId = String(skisl.ItemId) + '.00' + skisl.SalesKitItemsId;
                        }
                        salesKit.list[skisl.ItemId] = skisl;
                        salesKit.list[skisl.ItemId].Qty = 0;
                        salesKit.list[skisl.ItemId].componetid = ski.ItemId;
                        salesKit.list[skisl.ItemId].QtyValid = skisl.Quantity;
                      });
                      return selections;
                    }));

              });

              return $q.all(promises).then(function (sk) {
                salesKit.isEmpty = _.isEmpty(salesKit.list) && _.isEmpty(salesKit.selectedList);
                return salesKit;
              });

              /*--*/

              /*angular.forEach(salesKitItems, function (ski) {
                salesKit.selected = angular.copy(ski);
                //salesKit.list = {};
                salesKit.selectedList = {};
                ski.SalesKitId = itemId;

                  promises.push(DB.select(DB_CONFIG.tableNames.salesKit.salesKitSelections+" AS sks INNER JOIN "+DB_CONFIG.tableNames.item.item+' AS i ON i.Id = sks.SelectionId', '*, i.Id AS ItemId', { columns: 'SalesKitItemsId = ?', data: [ski.SaleKitItemsId]}).then(function (res) {
                    var selections = _.map(DB.fetchAll(res), function (row) {
                      row.SalesKitId = itemId;
                      row.Qty = 0;
                      row.Default = false;
                      row.Selectable = true;
                      return row;
                    });
                    if(selections.length > 0){
                      ski.Selections = selections;
                      ski.Selected = true;
                      ski.Qty = 0;
                      ski.Selectable = true;
                      selections.unshift(ski);
                      salesKit.selected.Selections = selections;
                      //salesKit.list[ski.SalesKitId] = ski;
                      Yi Yi Po
                      angular.forEach(selections, function (skisl) {
                       salesKit.list[skisl.ItemId] = skisl;
                       console.log(skisl);
                      });
                       salesKit.component[ski.ItemId] = ski;

                    } else {
                      ski.Qty = ski.Quantity;
                      ski.Quantity = ski.Quantity;
                      ski.Selected = true;
                      ski.Default = true;
                      ski.Selectable = false;
                      salesKit.selectedList[ski.ItemId] = ski;
                    }
                    return selections;
                }));

              });
              return $q.all(promises).then(function (sk) {

                salesKit.isEmpty = _.isEmpty(salesKit.list) && _.isEmpty(salesKit.selectedList);
                return salesKit;
              });
              */


            } else {
              return $q.resolve(false);
            }
          });
        }, function (err) {
          errorLog.log('SalesKits getSalesKit Error : ' + err.message);
          return $q.reject(err.message);
        });
      };

      self.getSalesKitWithId = function (salesKitId) {

        var deferred = $q.defer();
        var salesKit;
        var q = 'SELECT * FROM ' + DB_CONFIG.tableNames.salesKit.salesKitItems + ' AS sk' +
          ' INNER JOIN ' + DB_CONFIG.tableNames.item.item + ' AS i ON i.Id = sk.ItemId' +
          ' WHERE sk.SalesKitId = ?';

        DB.query(q, [itemId]).then(function (res) {
          var salesKitItems = DB.fetchAll(res);
          ItemService.getById(itemId).then(function (sk) {
            salesKit = sk;
            if (salesKitItems.length > 0) {
              var promises = {};
              angular.forEach(salesKitItems, function (ski) {
                salesKit.selected = angular.copy(ski);
                salesKit.list = {};
                salesKit.selectedList = {};
                ski.SalesKitId = itemId;
                // ItemService.getPrice(ski.Plu, ski.PriceGroupId).then(function (data) {
                //   ski.Price = data.Price || 0;

                promises[ski.ItemId] = DB.select(DB_CONFIG.tableNames.salesKit.salesKitSelections + ' AS sks INNER JOIN ' + DB_CONFIG.tableNames.item.item + ' AS i ON i.Id = sks.SelectionId', '*, i.Id AS ItemId', { columns: 'SalesKitItemsId = ?', data: [ski.Id]});
                DB.select(DB_CONFIG.tableNames.salesKit.salesKitSelections + ' AS sks INNER JOIN ' + DB_CONFIG.tableNames.item.item + ' AS i ON i.Id = sks.SelectionId', '*, i.Id AS ItemId', { columns: 'SalesKitItemsId = ?', data: [ski.Id]}).then(function (res) {
                  var selections = _.map(DB.fetchAll(res), function (row) {
                    row.SalesKitId = itemId;
                    row.Qty = 0;
                    row.Default = false;
                    return row;
                  });
                  if (selections.length > 0) {
                    ski.Selections = selections;
                    ski.Selected = true;
                    ski.Qty = 0;
                    selections.unshift(ski);
                    salesKit.selected.Selections = selections;
                    salesKit.list[ski.SalesKitId] = ski;

                  } else {
                    ski.Qty = ski.Quantity;
                    ski.Quantity = ski.Quantity;
                    ski.Selected = true;
                    ski.Default = true;
                    // salesKit.selectedList = {};
                    salesKit.selectedList[ski.ItemId] = ski;
                  }
                  deferred.resolve(salesKit);
                  // }, function (ex) {
                  //   deferred.reject(ex.message);
                  //   throw new Error(ex.message);
                  // });
                });

                // $q.all(promises, function (data) {
                //   angular.forEach(data, function (res, ItemId) {
                //     var i = _.findWhere(salesKitItems, { ItemId: ItemId });
                //     if(i){
                //       i
                //     }
                //   })
                // })


              });
            } else {
              deferred.resolve(false);
            }

          });

        }, function (err) {
          deferred.reject(err.message);
          errorLog.log('SalesKits getSalesKitWithId Error : ' + err);
          throw new Error(ex.message);
        });
        LogService.SaveLog();
        return deferred.promise;
      };

      var fetchSelections = function (item, salesKitId, itemId) {
        return DB.select(DB_CONFIG.tableNames.salesKit.salesKitSelections + ' AS sks INNER JOIN ' + DB_CONFIG.tableNames.item.item + ' AS i ON i.Id = sks.SelectionId', '*, i.Id AS ItemId', { columns: 'SalesKitItemsId = ?', data: [itemId]}).then(function (res) {
          item.Selections = _.map(DB.fetchAll(res), function (row) {
            row.SalesKitId = salesKitId;
            row.Qty = 0;
            row.Default = false;
            return row;
          });
          if (!_.isEmpty(item.Selections)) {
            item.Selected = true;
          }
        });
      };

      /**
       * Validates the bill object with property names in required array and returns an errors array
       * @param bill
       * @returns {Array}
       */
      var validateSalesKit = function (skitem) {
        var required = ['LocationId', 'MachineId', 'DocNo', 'PluType', 'ItemId', 'SuspendDepDocNo', 'OrderedBy', 'TakeAway',
          'ParentItemLineNumber', 'PriceLevelId', 'Price', 'Qty', 'DepAmount', 'Tax1Option', 'Tax2Option', 'Tax3Option',
          'Tax4Option', 'Tax5Option', 'Tax1Perc', 'Tax2Perc', 'Tax3Perc', 'Tax4Perc', 'Tax5Perc', 'NoDiscount', 'MultiDiscount', 'PriceChanged', 'Taxable', 'BelowCost', 'Comm'];

        var errors = [];
        if (skitem) {

          angular.forEach(required, function (attribute) {
            if (_.isUndefined(skitem[attribute]) || skitem[attribute] == null) {
              errors.push('Field ' + attribute + ' cannot be empty');
            }
          });
          if (skitem.Selections) {
            angular.forEach(skitem.Selections, function (item) {
              angular.forEach(required, function (attribute) {
                if (_.isUndefined(item[attribute]) || item[attribute] == null) {
                  errors.push('Field [' + skitem.LineNumber + ']' + attribute + ' cannot be empty');
                }
              });
            });
          } else {
            errorLog.log('validateSalesKit Error Nothing selected');
            errors.push('Nothing selected');
          }
        } else {
          errorLog.log('validateSalesKit Item not found');
          errors.push('Item not found');
        }
        LogService.SaveLog();
        return errors;
      };

      var prepareSalesKit = function (sk) {
        var deferred = $q.defer();
        var loc = _.omit(location, ['Code', 'Address1', 'Address2', 'Country', 'Description1', 'Description2', 'EntityId', 'LandSize', 'PostalCode', 'ShortName', 'Tax1Desc1',
          'Tax1DepApplicable', 'Tax5Desc1', 'Tax2Desc1', 'Tax3Desc1', 'Tax4Desc1', 'Tax2DepApplicable', 'Tax1Desc2', 'Tax2Desc2', 'Tax3Desc2', 'Tax4Desc2', 'Tax5Desc2', 'Tax3DepApplicable',
          'Tax4DepApplicable', 'Tax5DepApplicable']);
        var commonAttrs = {};
        sk = _.extend(sk, loc);

        commonAttrs.OrderedBy = AuthService.currentUser().Id;
        commonAttrs.SuspendDepDocNo = '';
        commonAttrs.TakeAway = false;
        commonAttrs.PromoPwpId = 0;
        commonAttrs.Comm = 0;
        commonAttrs.PriceChanged = false;
        commonAttrs.DepAmount = 0;
        commonAttrs.ByAmount = 0;
        commonAttrs.KitType = '';

        commonAttrs.BusinessDate = $filter('date')(ControlService.getBusinessDate(), 'yyyy-MM-dd');
        commonAttrs.MachineId = SettingsService.getMachineId();
        commonAttrs.DocNo = TenderService.generateReceiptId();
        sk = _.extend(sk, commonAttrs);

        var omitList = ['Id', 'Plu', 'Description1', 'Description2', 'PriceGroupId', 'ZeroPrice', 'AutoBundle', 'UOM', 'PLU_Description1', 'PLU_Description2',
          'KitchenId', 'SubPlu1Id', 'SubPlu2Id', 'SubPlu3Id', 'DepartmentId', 'UOM_Id', 'HouseBarCode', 'SalesKitItemsId', 'SelectionId', 'AdditionalPrice', 'AdditionalCost', 'Sequence'];
        DB.nextValue(DB_CONFIG.tableNames.bill.tempDetail, 'LineNumber').then(function (ln) {
          sk.LineNumber = ln;
          sk.ItemType = 'SKT';
          sk.ParentItemLineNumber = 0;
          sk.Selections = _.map(sk.Selections, function (item) {
            item.LineNumber = ++ln;
            item.ParentItemLineNumber = sk.LineNumber;
            item.ItemType = 'SKI';
            renameProperty(item, 'Id', 'ItemId');
            item = _.extend(item, loc);
            item = _.extend(item, commonAttrs);
            return _.omit(item, omitList);
          });
          angular.forEach(sk.Selections, function (item, key) {

          });
          deferred.resolve(_.omit(sk, omitList));
        });

        return deferred.promise;
      };


      self.addSalesKit = function (sk) {
        prepareSalesKit(sk).then(function (sk) {
          var errors = validateSalesKit(sk);
          if (errors.length == 0) {
            DB.clearQueue();
            angular.forEach(sk.Selections, function (item) {
              DB.addInsertToQueue(DB_CONFIG.tableNames.bill.tempDetail, BillService.calculateTax(item));
            });
            DB.addInsertToQueue(DB_CONFIG.tableNames.bill.tempDetail, BillService.calculateTax(_.omit(sk, 'Selections')));
            DB.executeQueue().then(function () {
              console.log('saved');
            }, function (err) {
              errorLog.log('addSalesKit error' + err);
              console.error(err);
            });
          } else {
            ErrorService.add(errors);
            console.log(errors);
            errorLog.log('addSalesKit Invalid item');
            throw new Error('Invalid item');
          }
        }, function (err) {
          errorLog.log('addSalesKit error' + err);
          console.log(err);
        });
        LogService.SaveLog();
      };

      self.getCurrentChildItems = function (parentItemLineNumber) {
        return DB.select(DB_CONFIG.tableNames.bill.tempDetail, 'Desc1, Desc2, Qty', { columns: 'ParentItemLineNumber=?', data: [parentItemLineNumber] }).then(function (res) {
          return DB.fetchAll(res);
        });
      };

      return self;
    }]);
