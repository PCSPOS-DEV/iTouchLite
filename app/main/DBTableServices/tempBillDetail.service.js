/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory('TempBillDetailService', ['LocationService', 'ControlService', '$localStorage', 'ErrorService', 'DB', 'DB_CONFIG', 'TenderService', 'SettingsService', '$filter', 'AuthService', '$q', 'TaxService',
    function (LocationService, ControlService, $localStorage, ErrorService, DB, DB_CONFIG, TenderService, SettingsService, $filter, AuthService, $q, TaxService) {
      var self = this;
      self.table = DB_CONFIG.tableNames.bill.tempDetail;


      var columnList = ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'PluType', 'KitType', 'ItemId', 'LineNumber', 'OrderedDateTime',
        'SuspendDepDocNo', 'OrderedBy', 'SpecialOrderRemark', 'ServingTime', 'TakeAway', 'ItemType', 'ParentItemLineNumber', 'PromoPwpId',
        'PriceLevelId', 'StdCost', 'OrgPrice', 'AlteredPrice', 'WaCost', 'Price', 'Qty', 'SubTotal', 'DiscAmount', 'Tax1DiscAmount',
        'Tax2DiscAmount', 'Tax3DiscAmount', 'Tax4DiscAmount', 'Tax5DiscAmount', 'Tax1Amount', 'Tax2Amount', 'Tax3Amount', 'Tax4Amount', 'Tax5Amount', 'Tax1Option', 'DepAmount',
        'Tax2Option', 'Tax3Option', 'Tax4Option', 'Tax5Option', 'Tax1Perc', 'Tax2Perc', 'Tax3Perc', 'Tax4Perc', 'Tax5Perc', 'NoDiscount',
        'ByAmount', 'CurCode', 'BuyRate', 'ReasonId', 'RefCode', 'Remark', 'MultiDiscount', 'PriceChanged', 'Taxable', 'BelowCost', 'Comm', 'Desc1', 'Desc2', 'Selectable', 'ParentItemLineNumber'];


      self.prepareItem = function (item) {
        var locationPromise;
        if (!item.LocationId || !item.PriceLevelId) {
          locationPromise = LocationService.get().then(function (loc) {
            item.LocationId = loc.LocationId;
            item.PriceLevelId = loc.PriceLevelId;
            return item;
          });
        } else {
          locationPromise = $q.when(item);
        }
        return locationPromise.then(function (item) {

          item.OrderedBy = AuthService.currentUser() ? AuthService.currentUser().Id : 0;
          item.ParentItemLineNumber = item.ParentItemLineNumber || 0;
          item.SuspendDepDocNo = item.SuspendDepDocNo || null;
          item.TakeAway = item.TakeAway || false;
          item.ItemType = item.ItemType || 'NOR';
          item.PromoPwpId = item.PromoPwpId || 0;
          item.Comm = item.Comm || 0;
          item.PriceChanged = item.PriceChanged || false;
          item.DepAmount = item.DepAmount || 0;
          item.ByAmount = item.ByAmount || 0;
          item.KitType = item.KitType || 0;

          item.BusinessDate = item.BusinessDate || ControlService.getBusinessDate(true);
          item.MachineId = item.MachineId || SettingsService.getMachineId();
          item.LocationId = item.LocationId || SettingsService.setLocationId();
          if (!item.Qty) {
            item.Qty = 1;
          }
          if (!item.Price || item.ItemType != 'SKI') {
            item = TaxService.calculateTax(item);
          }
          if (!item.OrgPrice) {item.OrgPrice = item.Price;}
          if (!item.AlteredPrice) {item.AlteredPrice = item.Price;}
          if (_.isUndefined(item.StdCost)) {item.StdCost = 0;}
          if (!item.WaCost) {item.WaCost = 0;}
          if (!item.DiscAmount) {item.DiscAmount = 0;}
          if (!item.Tax1DiscAmount) {item.Tax1DiscAmount = 0;}
          if (!item.Tax2DiscAmount) {item.Tax2DiscAmount = 0;}
          if (!item.Tax3DiscAmount) {item.Tax3DiscAmount = 0;}
          if (!item.Tax4DiscAmount) {item.Tax4DiscAmount = 0;}
          if (!item.Tax5DiscAmount) {item.Tax5DiscAmount = 0;}

          if (!item.Tax1Amount) {item.Tax1Amount = 0;}
          if (!item.Tax2Amount) {item.Tax2Amount = 0;}
          if (!item.Tax3Amount) {item.Tax3Amount = 0;}
          if (!item.Tax4Amount) {item.Tax4Amount = 0;}
          if (!item.Tax5Amount) {item.Tax5Amount = 0;}

          //removing unnecessary attributes
          item = _.pick(item, columnList);
          return item;
        });

      };

      /**
       * Validates the bill object with property names in required array and returns an errors array
       * @param bill
       * @returns {Array}
       */
      self.validate = function (item) {
        var required = ['LocationId', 'MachineId', 'DocNo', 'PluType', 'ItemId', 'SuspendDepDocNo', 'OrderedBy', 'TakeAway',
          'ParentItemLineNumber', 'PriceLevelId', 'Price', 'Qty', 'DepAmount', 'Tax1Option', 'Tax2Option', 'Tax3Option',
          'Tax4Option', 'Tax5Option', 'Tax1Perc', 'Tax2Perc', 'Tax3Perc', 'Tax4Perc', 'Tax5Perc', 'NoDiscount', 'MultiDiscount', 'PriceChanged', 'Taxable', 'BelowCost', 'Comm'];
        var errors = [];
        if (item) {
          angular.forEach(required, function (attribute) {
            if (_.isUndefined(item[attribute]) || item[attribute] == null) {
              errors.push('Field ' + attribute + ' cannot be empty');
            }
          });
        } else {
          errors.push('Item not found');
        }

        return errors;
      };

      self.insert = function (DocNo, item, queue) {
        item.DocNo = DocNo;
        return self.prepareItem(item).then(function (item) {
          var errors = self.validate(item);
          if (errors.length == 0) {
            if (queue) {
              return DB.addInsertToQueue(self.table, item);
            }  else {
              return DB.insert(self.table, item);
            }
          } else {
            return queue ? errors.join(', ') : $q.reject(errors.join(', '));
          }
        });
      };


      self.delete = function (where, addInsertToQueue) {
        if (where && where.columns && where.data) {
          if (addInsertToQueue) {
            DB.addDeleteToQueue(self.table, where);
            return $q.when(true);
          } else {
            return DB.delete(self.table, where);
          }
        } else {
          return $q.reject('Invalid where value');
        }
      };

      self.getChildItems = function (lineNumber) {
        return DB.select(self.table, '*', { columns: 'ParentItemLineNumber=?', data: [lineNumber] }).then(function (res) {
          return DB.fetchAll(res);
        });
      };

      return self;
    }
  ]);
