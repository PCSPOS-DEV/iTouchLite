/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory("VoidItemsService", ['LocationService', 'ControlService', '$localStorage', 'ErrorService', 'DB', 'DB_CONFIG', 'TenderService', 'SettingsService', '$filter', 'AuthService', '$q', 'ShiftService',
    function (LocationService, ControlService, $localStorage, ErrorService, DB, DB_CONFIG, TenderService, SettingsService, $filter, AuthService, $q, ShiftService) {
      var self = this;
      self.table = DB_CONFIG.tableNames.bill.voidItems;


      var columnList = ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'IsExported', 'SysDateTime',
        'LineNumber', 'ItemType', 'ParentItemId', 'ShiftId', 'CashierId', 'StaffId', 'OrgPrice', 'AlteredPrice', 'Price', 'Qty', 'DiscAmount', 'SubTotal', 'SeqNo' , 'SysDateTime'];


      self.prepareItem = function (item) {
        var locationPromise;
        if(!item.LocationId || !item.PriceLevelId){
          locationPromise = LocationService.get().then(function(loc){
            item.LocationId = loc.LocationId;
            item.PriceLevelId = loc.PriceLevelId;
            return item;
          });
        } else {
          locationPromise = $q.when(item);
        }
        return locationPromise.then(function(item){

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
          item.KitType = item.KitType || "";

          item.BusinessDate = item.BusinessDate || ControlService.getBusinessDate(true);
          item.MachineId = item.MachineId || SettingsService.getMachineId();
          item.LocationId = item.LocationId || SettingsService.setLocationId();
          if (!item.Qty) {
            item.Qty = 1;
          }
          if(!item.Price || item.ItemType != 'SKI'){
            item = self.calculateTax(item);
          }
          if(!item.OrgPrice) item.OrgPrice = item.Price;
          if(!item.AlteredPrice) item.AlteredPrice = item.Price;
          if(_.isUndefined(item.StdCost)) item.StdCost = 0;
          if(!item.WaCost) item.WaCost = 0;
          if(!item.DiscAmount) item.DiscAmount = 0;
          if(!item.Tax1DiscAmount) item.Tax1DiscAmount = 0;
          if(!item.Tax2DiscAmount) item.Tax2DiscAmount = 0;
          if(!item.Tax3DiscAmount) item.Tax3DiscAmount = 0;
          if(!item.Tax4DiscAmount) item.Tax4DiscAmount = 0;
          if(!item.Tax5DiscAmount) item.Tax5DiscAmount = 0;

          if(!item.Tax1Amount) item.Tax1Amount = 0;
          if(!item.Tax2Amount) item.Tax2Amount = 0;
          if(!item.Tax3Amount) item.Tax3Amount = 0;
          if(!item.Tax4Amount) item.Tax4Amount = 0;
          if(!item.Tax5Amount) item.Tax5Amount = 0;

          //removing unnecessary attributes
          item = _.pick(item, columnList);
          return item;
        });

      }

      var getSeqNo = function(itemId, itemType, lineNumber){
        return DB.max(DB_CONFIG.tableNames.bill.voidItems, 'SeqNo', { columns: 'ItemId = ? AND ItemType = ? AND LineNumber = ?', data:[itemId, itemType, lineNumber] }).then(function(ln){
          return ++ln;
        });
      }

      /**
       * Validates the bill object with property names in required array and returns an errors array
       * @param bill
       * @returns {Array}
       */
      self.validate = function (item) {
        var required = columnList;
        var errors = [];
        if(item){
          angular.forEach(required, function (attribute) {
            if (_.isUndefined(item[attribute]) || item[attribute] == null) {
              errors.push("Field " + attribute + " cannot be empty");
            }
          });
        } else {
          errors.push("Void Item not found");
        }

        return errors;
      }

      self.insert = function(item, addInsertToQueue){
        return getSeqNo(item.ItemId, item.ItemType, item.LineNumber).then(function(seqNo){
          item.SeqNo = seqNo;
          item = _.pick(item, columnList);
          item.IsExported = false;
          item.ParentItemId = item.ParentItemId || 0;
          item.StaffId = AuthService.currentUser().Id;
          item.CashierId = AuthService.currentUser().Id;
          item.SysDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
          item.ShiftId = ShiftService.getCurrent().Id;
          var errors = self.validate(item);
          if(errors.length == 0){
            if(addInsertToQueue){
              DB.addInsertToQueue(self.table, item);
              return true;
            } else {
              return DB.insert(self.table, item);
            }
          } else {
            return $q.reject("Unable to save to DB "+errors.join(', '));
          }
        });
      }


      self.delete = function (where, addInsertToQueue) {
        if(where && where.columns && where.data){
          if(addInsertToQueue){
            DB.addDeleteToQueue(self.table, where);
            return $q.when(true);
          } else {
            return DB.delete(self.table, where);
          }
        } else {
          return $q.reject('Invalid where value');
        }
      }

      return self;
    }
  ]);
