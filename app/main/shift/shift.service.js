/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory("ShiftService", ['ErrorService', 'DB', 'DB_CONFIG', 'SettingsService', '$q', 'Restangular', '$localStorage', 'AuthService', 'ControlService', '$filter', 'ItemService',
    function (ErrorService, DB, DB_CONFIG, SettingsService, $q, Restangular, $localStorage, AuthService, ControlService, $filter, ItemService) {
      var self = this;

      self.fetch = function () {
        var deferred = $q.defer();
        try {
          Restangular.one("GetShifts").get({LocationId: SettingsService.getLocationId()}).then(function (res) {
            var items = JSON.parse(res);
            if (items) {
              self.save(items);
              deferred.resolve();
            } else {
              deferred.reject('Unable to fetch Shifts');
            }

          }, function (err) {
            throw new Error(err);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          deferred.reject(ex);
        }

        return deferred.promise;
      }

      self.save = function (items) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.auth.shifts, items);
      }

      self.getUnOpened = function () {
        var deferred = $q.defer();
        DB.query("SELECT s.*, ss.OpenDateTime, ss.CloseDateTime, OpenUser, CloseUser, DeclareCashLater FROM shifts AS s LEFT OUTER JOIN shiftstatus AS ss ON s.Id = ss.Id WHERE CloseDateTime IS NULL", []).then(function (data) {
          deferred.resolve(DB.fetchAll(data));
        }, function (ex) {
          throw new Error(ex.message);
          deferred.reject(ex.message);
        });
        return deferred.promise;
      }

      self.getOpened = function () {
        var deferred = $q.defer();
        DB.query("SELECT s.*, ss.OpenDateTime, ss.CloseDateTime, OpenUser, CloseUser, DeclareCashLater FROM shifts AS s LEFT OUTER JOIN shiftstatus AS ss ON s.Id = ss.Id WHERE CloseDateTime IS NULL AND OpenDateTime IS NOT NULL", []).then(function (data) {
          deferred.resolve(DB.fetchAll(data));
        }, function (ex) {
          throw new Error(ex.message);
          deferred.reject(ex.message);
        });
        return deferred.promise;
      }

      self.getById = function (id) {
        var deferred = $q.defer();
        DB.query("SELECT * FROM shifts WHERE Id = ?", [id]).then(function (data) {
          deferred.resolve(DB.fetch(data));
        }, function (ex) {
          throw new Error(ex.message);
          deferred.reject(ex.message);
        });
        return deferred.promise;
      }

      self.getDeclareCashShifts = function () {
        var deferred = $q.defer();
        DB.query("SELECT * FROM shifts WHERE Id IN(SELECT Id FROM shiftstatus WHERE CloseDateTime IS NOT NULL AND DeclareCashLater)", []).then(function (data) {
          deferred.resolve(DB.fetchAll(data));
        }, function (ex) {
          throw new Error(ex.message);
          deferred.reject(ex.message);
        });
        return deferred.promise;
      }

      self.dayEndPossible = function () {
        return DB.query("SELECT COUNT(*) AS count FROM shiftstatus", []).then(function (data) {
          var count = DB.fetch(data).count;
          return count > 0;
        });
      }

      self.saveCurrent = function (shift) {
        $localStorage.shift = shift;

        return DB.insert(DB_CONFIG.tableNames.auth.shiftStatus, {
          Id: shift.Id,
          ShiftName: shift.Description1,
          OpenDateTime: new Date().toDateTime(),
          OpenUser: AuthService.currentUser() ? AuthService.currentUser().Code : null,
          RA: shift.RA,
          RANoAdj: shift.RANoAdj,
          DeclareCashLater: false
        });

      }

      self.addFloat = function(shift, amount){
        var header = initBillHeader();
        header.DocType = 'RA';
        header.Remarks = "Add Float";
        header.SubTotal = amount;
        header.ShiftId = shift.Id;
        header.CashierId = shift.Id;

        var payTrans = initPayTrans(header.DocNo);
        payTrans.Amount = amount

        return $q.all({
          header: DB.insert(DB_CONFIG.tableNames.bill.header, header),
          payTrans: DB.insert(DB_CONFIG.tableNames.bill.payTransactions, payTrans)
        }).then(function(){
          ControlService.counterDocId(header.DocNo);
          return true;
        });
      }

      self.closeShift = function (shiftId) {
        var deferred = $q.defer();
        var shift = self.getCurrent();

        if(shift || shiftId){
          DB.query("SELECT * FROM shiftstatus WHERE Id = ?", [shiftId || shift.Id]).then(function(res){
            shift = DB.fetch(res);
            if(shift){
              console.log(shift);
              shift.CloseDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
              DB.update('ShiftStatus', _.omit(shift, 'Id'), { columns: 'Id= ?', data: [shift.Id]}).then(function(){
                self.clearCurrent();
                deferred.resolve();
              }, function(error){
                deferred.reject(error);
              });
            } else {
              deferred.reject("Shift is not valid");
            }
          }, function(error){
            deferred.reject(error);
          });
        }

        return deferred.promise;
      }

      self.getCurrent = function () {
        return $localStorage.shift ? $localStorage.shift : null;
      }

      self.clearCurrent = function () {
        $localStorage.shift = null;
      }

      self.getCurrentId = function () {
        return $localStorage.shift ? $localStorage.shift.Id : null;
      }

      /**
       *
       * @param cash
       * @param shiftId
       */
      self.declareCash = function(cash, shiftId){
        var shift = self.getCurrent();

        if(shift || shiftId){
          return DB.query("SELECT * FROM shiftstatus WHERE Id = ?", [shiftId || shift.Id]).then(function(res){
            shift = DB.fetch(res);
            if(shift){
              console.log(shift);
              shift.DeclareCashLater = 0;
              return $q.all({
                'updateShift': DB.update('ShiftStatus', _.omit(shift, 'Id'), { columns: 'Id= ?', data: [shift.Id]}),
                'createHeader': declareCash(cash, shift.Id)
              });
            } else {
              return $q.reject("Shift is not valid");
            }
          });
        } else {
          return $q.reject("Shift is not valid");
        }
      }

      self.declareCashLater = function(shiftId){
        var shift = self.getCurrent();

        if(shift || shiftId){
          return DB.query("SELECT * FROM shiftstatus WHERE Id = ?", [shiftId || shift.Id]).then(function(res){
            shift = DB.fetch(res);
            if(shift){
              console.log(shift);
              shift.DeclareCashLater = 1;
              return DB.update('ShiftStatus', _.omit(shift, 'Id'), { columns: 'Id= ?', data: [shift.Id]});
              // deferred.resolve();
            } else {
              return $q.reject("Shift is not valid");
            }
          });
        } else {
          return $q.reject("Shift is not valid");
        }
      }

      var initBillHeader = function(){
        header = {};
        header.DocNo = ControlService.getNextDocId();
        header.DocType = null;
        header.LocationId = SettingsService.getLocationId();
        header.MachineId = SettingsService.getMachineId();
        header.BusinessDate = ControlService.getBusinessDate(true);
        header.SysDateTime = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');

        header.AuthBy = 0;
        header.VipId = 0;
        header.CashierId = null;
        header.TableId = 0;
        header.DepAmount = 0;
        header.VoidDocNo = 0;
        header.ReprintCount = 0;
        header.OrderTag = "";
        header.Remarks = null;
        header.IsClosed = true;
        header.Pax = 0;

        header.SubTotal = 0;
        header.ShiftId = null;

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

        header.Tax1Option = 0;
        header.Tax1Perc = 0;
        header.Tax2Option = 0;
        header.Tax2Perc = 0;
        header.Tax3Option = 0;
        header.Tax3Perc = 0;
        header.Tax4Option = 0;
        header.Tax4Perc = 0;
        header.Tax5Option = 0;
        header.Tax5Perc = 0;
        header.IsExported = true;
        header.IsClosed = true;
        return header;
      }

      var initPayTrans = function(DocNo){
        return {
          BusinessDate: ControlService.getBusinessDate(true),
          LocationId: SettingsService.getLocationId(),
          MachineId: SettingsService.getMachineId(),
          DocNo: DocNo,
          Cash: 'true',
          SeqNo: 1,
          PayTypeId: SettingsService.getCashId(),
          Amount: 0,
          ChangeAmount: 0,
          ConvRate: 0,
          CurrencyId: 0,
          IsExported: true
        };
      }

      var declareCash = function(Amount, ShiftId){
        var header = initBillHeader();
        header.DocType = 'CD';
        header.Remarks = "Declare Cash";
        header.SubTotal = Amount;
        header.ShiftId = ShiftId;
        header.CashierId = ShiftId;

        var payTrans = initPayTrans(header.DocNo);
        payTrans.Amount = Amount

        return $q.all({
          header: DB.insert(DB_CONFIG.tableNames.bill.header, header),
          payTrans: DB.insert(DB_CONFIG.tableNames.bill.payTransactions, payTrans)
        }).then(function(){
          ControlService.counterDocId(header.DocNo);
          return true;
        });
      }

      self.dayEnd = function(){
        var deferred = $q.defer();
        DB.clearQueue();
        DB.addDeleteToQueue("ShiftStatus");
        DB.addDeleteToQueue(DB_CONFIG.tableNames.bill.header, { columns: 'IsExported = ?', data: ['true'] });
        DB.addDeleteToQueue(DB_CONFIG.tableNames.bill.detail, { columns: 'IsExported = ?', data: ['true'] });
        DB.addDeleteToQueue(DB_CONFIG.tableNames.bill.payTransactions, { columns: 'IsExported = ?', data: ['true'] });
        DB.addDeleteToQueue(DB_CONFIG.tableNames.bill.payTransactionsOverTender, { columns: 'IsExported = ?', data: ['true'] });
        DB.addDeleteToQueue(DB_CONFIG.tableNames.bill.voidItems, { columns: 'IsExported = ?', data: ['true'] });
        DB.addDeleteToQueue(DB_CONFIG.tableNames.discounts.billDiscounts, { columns: 'IsExported = ?', data: ['true'] });

        DB.executeQueue().then(function(){
          $localStorage.shift = null;
          ControlService.setDayEndDate(ControlService.getBusinessDate());
          deferred.resolve();
        }, function(err){
          deferred.reject(err);
        });

        return deferred.promise;
      }

      var getHeaderDetailsForMode = function(shiftId, mode, discounted, businessDate){
        var q = "SELECT ShiftId, "
          +"COUNT(*) AS ItemCount, "
          +"SUM(SubTotal) AS SubTotal, "
          +"SUM(DiscAmount) AS DiscAmount, "
          +"SUM(Tax1Amount) AS Tax1Amount, "
          +"SUM(Tax2Amount) AS Tax2Amount, "
          +"SUM(Tax3Amount) AS Tax3Amount, "
          +"SUM(Tax4Amount) AS Tax4Amount, "
          +"SUM(Tax5Amount) AS Tax5Amount, "
          +"SUM(Tax1DiscAmount) AS Tax1DiscAmount, "
          +"SUM(Tax2DiscAmount) AS Tax2DiscAmount, "
          +"SUM(Tax3DiscAmount) AS Tax3DiscAmount, "
          +"SUM(Tax4DiscAmount) AS Tax4DiscAmount, "
          +"SUM(Tax5DiscAmount) AS Tax5DiscAmount "
        +"FROM BillHeader WHERE BusinessDate=? ";
        var data = [businessDate];

        if(_.isUndefined(mode) || _.isNull(mode)){

        } else {
          q += "AND DocType = ? ";
          data.push(mode);
        }

        if(_.isUndefined(shiftId) || _.isNull(shiftId)){

        } else {
          q += "AND ShiftId = ? ";
          data.push(shiftId);
        }

        if(discounted){
          q += "AND DiscAmount > 0 ";
        }
        q += "GROUP BY ShiftId";
        return DB.query(q, data).then(function(res){ return DB.fetchAll(res); });
      }

      var getItemDetails = function(type, shiftId, businessDate){
        var q = "SELECT "
          +"COUNT(*) AS ItemCount, "
          +"SUM(d.SubTotal) AS SubTotal, "
          +"SUM(d.DiscAmount) AS DiscAmount, "
          +"SUM(d.Tax1Amount) AS Tax1Amount, "
          +"SUM(d.Tax2Amount) AS Tax2Amount, "
          +"SUM(d.Tax3Amount) AS Tax3Amount, "
          +"SUM(d.Tax4Amount) AS Tax4Amount, "
          +"SUM(d.Tax5Amount) AS Tax5Amount, "
          +"SUM(d.Tax1DiscAmount) AS Tax1DiscAmount, "
          +"SUM(d.Tax2DiscAmount) AS Tax2DiscAmount, "
          +"SUM(d.Tax3DiscAmount) AS Tax3DiscAmount, "
          +"SUM(d.Tax4DiscAmount) AS Tax4DiscAmount, "
          +"SUM(d.Tax5DiscAmount) AS Tax5DiscAmount "
          +"FROM BillDetail AS d INNER JOIN BillHeader AS h ON d.DocNo = h.DocNo WHERE  h.BusinessDate=? ";
        switch(type){
          case 'reverse':
            q += "AND Qty < 0 ";
            break;
        }
        var data = [businessDate];

        if(!_.isUndefined(shiftId)){
          q += "AND ShiftId = ? ";
          data.push(shiftId);
        }
        q += "GROUP BY ShiftId";
        return DB.query(q, data).then(function(res){ return DB.fetchAll(res); });
      }

      var getReceiptCount = function(shiftId, bDate){
        var q = "SELECT  COUNT(*) AS ItemCount FROM BillHeader WHERE BusinessDate=? AND DocType = 'SA' OR DocType = 'VD' "
        var data = [bDate];
        if(shiftId){
          q += " AND ShiftId = ?"
          data.push(shiftId);
        }
        q += " GROUP BY ShiftId";
        return DB.query(q, data).then(function(res){ return DB.fetch(res); });
      }

      var getVoidItemDetails = function(shiftId, businessDate){
        var q = "SELECT "
          +"COUNT(*) AS ItemCount, "
          +"SUM(d.SubTotal) AS SubTotal, "
          +"SUM(d.DiscAmount) AS DiscAmount "
          +"FROM VoidItems AS d WHERE  BusinessDate=? ";
        var data = [businessDate];

        if(!_.isUndefined(shiftId)){
          q += "AND ShiftId = ? ";
          data.push(shiftId);
        }
        q += "GROUP BY ShiftId";
        return DB.query(q, data).then(function(res){ return DB.fetchAll(res); });
      }

      self.getHeaderDetails = function(shiftId, businessDate){
        return $q.all({
          sales: getHeaderDetailsForMode(shiftId, 'SA', null, businessDate),
          void: getHeaderDetailsForMode(shiftId, 'VD', null, businessDate),
          float: getHeaderDetailsForMode(shiftId, 'RA', null, businessDate),
          payout: getHeaderDetailsForMode(shiftId, 'PO', null, businessDate),
          receiveIn: getHeaderDetailsForMode(shiftId, 'RI', null, businessDate),
          cashDeclared: getHeaderDetailsForMode(shiftId, 'CD', null, businessDate),
          reverse: getItemDetails('reverse', shiftId, businessDate),
          itemVoid: getVoidItemDetails(shiftId, businessDate),
          discounted: getHeaderDetailsForMode(shiftId, null, true, businessDate),
          recCount: getReceiptCount(businessDate)
        }).then(function(data){
          data.sales = ItemService.calculateTotal(_.first(data.sales));
          data.discounted = ItemService.calculateTotal(_.first(data.discounted));
          data.refund = ItemService.calculateTotal(_.first(data.refund));
          data.float = ItemService.calculateTotal(_.first(data.float));
          data.payout = ItemService.calculateTotal(_.first(data.payout));
          data.void = ItemService.calculateTotal(_.first(data.void));
          data.receiveIn = ItemService.calculateTotal(_.first(data.receiveIn));
          data.cashDeclared = ItemService.calculateTotal(_.first(data.cashDeclared));
          data.reverse = ItemService.calculateTotal(_.first(data.reverse));
          data.itemVoid = ItemService.calculateTotal(_.first(data.itemVoid));

          return data;
        });
      }

      var getTransDetailsForMode = function(shiftId, cash, rounded, bDate){
        var q = "SELECT COUNT(*) AS ItemCount, SUM(Amount) AS Amount, SUM(ChangeAmount) AS ChangeAmount FROM PayTrans AS p INNER JOIN BillHeader AS h ON p.DocNo = h.DocNo WHERE h.BusinessDate=? AND Cash = ? AND DocType != 'CD' ";
        var data = [bDate, cash];
        // +"WHERE DocType = 'SA' "
        if(shiftId){
          q += "AND ShiftId = ? ";
          data.push(shiftId);
        }
        if(rounded){
          q += "AND PayTypeId = -1 ";
        } else {
          q += "AND PayTypeId > 0 ";
        }
        q += "GROUP BY ShiftId";
        return DB.query(q, data).then(function(res){ return DB.fetchAll(res); });
      }

      self.getTransDetails = function(shiftId, bDate){
        return $q.all({
          cash: getTransDetailsForMode(shiftId, 'true', null, bDate),
          nonCash: getTransDetailsForMode(shiftId, 'false', null, bDate),
          rounded: getTransDetailsForMode(shiftId, 'false', true, bDate)
        }).then(function(data){
          data.cash = _.first(data.cash);
          data.nonCash = _.first(data.nonCash);
          data.rounded = _.first(data.rounded);

          return data;
        });
      }

      return self;
    }]);
