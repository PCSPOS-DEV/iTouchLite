/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory("ShiftService", ['ErrorService', 'DB', 'DB_CONFIG', 'SettingsService', '$q', 'Restangular', '$localStorage', 'AuthService', 'ControlService', '$filter',
    function (ErrorService, DB, DB_CONFIG, SettingsService, $q, Restangular, $localStorage, AuthService, ControlService, $filter) {
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
        DB.query("SELECT * FROM shifts WHERE Id NOT IN(SELECT Id FROM shiftstatus)", []).then(function (data) {
          deferred.resolve(DB.fetchAll(data));
        }, function (ex) {
          throw new Error(ex.message);
          deferred.reject(ex.message);
        });
        return deferred.promise;
      }

      self.getOpened = function () {
        var deferred = $q.defer();
        DB.query("SELECT * FROM shifts WHERE Id IN(SELECT Id FROM shiftstatus WHERE CloseDateTime IS NULL)", []).then(function (data) {
          deferred.resolve(DB.fetchAll(data));
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
        var deferred = $q.defer();
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
              deferred.reject("Shift is not valid");
            }
          }, function(error){
            deferred.reject(error);
          });
        }

        return deferred.promise;
      }

      self.declareCashLater = function(shiftId){
        var deferred = $q.defer();
        var shift = self.getCurrent();

        if(shift || shiftId){
          DB.query("SELECT * FROM shiftstatus WHERE Id = ?", [shiftId || shift.Id]).then(function(res){
            shift = DB.fetch(res);
            if(shift){
              console.log(shift);
              shift.DeclareCashLater = 1;
              return DB.update('ShiftStatus', _.omit(shift, 'Id'), { columns: 'Id= ?', data: [shift.Id]});
              // deferred.resolve();
            } else {
              deferred.reject("Shift is not valid");
            }
          }, function(error){
            deferred.reject(error);
          });
        }

        return deferred.promise;
      }

      var declareCash = function(Amount, ShiftId){
        header = {};
        header.DocNo = ControlService.getNextDocId();
        header.DocType = 'CD';
        header.LocationId = SettingsService.getLocationId();
        header.MachineId = SettingsService.getMachineId();
        header.BusinessDate = ControlService.getBusinessDate(true);
        header.SysDateTime = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');

        header.AuthBy = 0;
        header.VipId = 0;
        header.CashierId = ShiftId;
        header.TableId = 0;
        header.DepAmount = 0;
        header.VoidDocNo = 0;
        header.ReprintCount = 0;
        header.OrderTag = "";
        header.Remarks = "Declare Cash";
        header.IsClosed = true;
        header.Pax = 0;

        header.SubTotal = Amount;
        header.ShiftId = ShiftId;

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

        return DB.insert(DB_CONFIG.tableNames.bill.header, header).then(function(){
          ControlService.saveDocId(header.DocNo);
          return true;
        });
      }

      self.dayEnd = function(){
        var deferred = $q.defer();
        DB.clearQueue();
        DB.addDeleteToQueue("ShiftStatus");

        DB.executeQueue().then(function(){
          ControlService.setDayEndDate(ControlService.getBusinessDate());
          deferred.resolve();
        }, function(err){
          deferred.reject(err);
        });

        return deferred.promise;
      }

      return self;
    }]);
