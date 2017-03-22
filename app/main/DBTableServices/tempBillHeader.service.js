/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory("TempBillHeaderService", ['LocationService', 'ControlService', '$localStorage', 'ErrorService', 'DB', 'DB_CONFIG', 'TenderService', 'SettingsService', '$filter', 'AuthService', '$q', 'ShiftService',
    function (LocationService, ControlService, $localStorage, ErrorService, DB, DB_CONFIG, TenderService, SettingsService, $filter, AuthService, $q, ShiftService) {
      var self = this;
      self.table = DB_CONFIG.tableNames.bill.tempHeader;


      var columnList = ['BusinessDate','LocationId', 'MachineId', 'DocNo', 'DocType', 'SysDateTime', 'VoidDocNo', 'TableId',
        'SuspendDepDocNo', 'OrderedBy', 'SpecialOrderRemark', 'ServingTime', 'TakeAway', 'ItemType', 'ParentItemLineNumber', 'PromoPwpId',
        'Pax', 'ShiftId', 'VipId', 'CashierId', 'StaffId', 'AuthBy', 'SubTotal', 'DepAmount', 'DiscAmount', 'Tax1DiscAmount',
        'Tax2DiscAmount', 'Tax3DiscAmount', 'Tax4DiscAmount', 'Tax5DiscAmount', 'Tax1Amount','Tax2Amount','Tax3Amount','Tax4Amount','Tax5Amount','Tax1Option',
        'Tax2Option', 'Tax3Option', 'Tax4Option', 'Tax5Option', 'Tax1Perc', 'Tax2Perc', 'Tax3Perc', 'Tax4Perc', 'Tax5Perc', 'ReprintCount',
        'Remarks', 'OrderTag', 'IsExported', 'IsClosed'];

      self.generateReceiptId = function () {
        return ControlService.getNextDocId();
      }

      self.saveReceiptId = function (docNo) {
        ControlService.saveDocId(docNo);
      }

      self.getCurrentReceiptId = function () {
        return ControlService.getDocId();
      }


      self.init = function () {
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
          var header;
          header = {};
          header.DocNo = self.generateReceiptId();
          header.DocType = TenderService.getDocType();
          header.LocationId = SettingsService.getLocationId();
          header.MachineId = SettingsService.getMachineId();
          header.BusinessDate = ControlService.getBusinessDate(true);
          header.SysDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
          header.ShiftId = ShiftService.getCurrentId();
          header.AuthBy = 0;
          header.VipId = 0;
          header.CashierId = AuthService.currentUser().Id;
          header.TableId = 0;
          header.DepAmount = 0;
          header.VoidDocNo = null;
          header.ReprintCount = 0;
          header.OrderTag = "";
          header.Remarks = "";
          header.IsClosed = false;
          header.Pax = 0;

          header.Tax1Option = location.Tax1Option;
          header.Tax1Perc = location.Tax1Perc;
          header.Tax2Option = location.Tax2Option;
          header.Tax2Perc = location.Tax2Perc;
          header.Tax3Option = location.Tax3Option;
          header.Tax3Perc = location.Tax3Perc;
          header.Tax4Option = location.Tax4Option;
          header.Tax4Perc = location.Tax4Perc;
          header.Tax5Option = location.Tax5Option;
          header.Tax5Perc = location.Tax5Perc;
          header.SubTotal = 0;
          header.DepAmount = 0;
          header.DiscAmount = 0;
          header.Tax1DiscAmount = 0;
          header.Tax2DiscAmount = 0;
          header.Tax3DiscAmount = 0;
          header.Tax4DiscAmount = 0;
          header.Tax5DiscAmount = 0;
          header.Tax1Amount = 0;
          header.Tax2Amount = 0;
          header.Tax3Amount = 0;
          header.Tax4Amount = 0;
          header.Tax5Amount = 0;


          return DB.insert(self.table, header).then(function () {
            ControlService.saveDocId(header.DocNo);
          });
        });
      }

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
        if(item){
          angular.forEach(required, function (attribute) {
            if (_.isUndefined(item[attribute]) || item[attribute] == null) {
              errors.push("Field " + attribute + " cannot be empty");
            }
          });
        } else {
          errors.push("Header not found");
        }

        return errors;
      }

      self.insert = function(DocNo, item){
       return DB.update(self.table, item, { columns: 'DocNo=?', data: [DocNo] });
      }

      self.update = function(DocNo, values){
        return DB.update(self.table, values, { columns: 'DocNo=?', data: [DocNo] });
      }


      self.delete = function (where) {
        if(where && where.columns && where.data){
          return $q.reject('Invalid where value');
        } else {
          return DB.delete(DB_CONFIG.tableNames.bill.tempDetail, where);
        }
      }

      return self;
    }
  ]);
