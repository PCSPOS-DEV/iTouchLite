'use strict';
angular.module('itouch.services')
  .service('UploadService', ['$log', 'DB', 'DB_CONFIG', '$q', 'SettingsService', 'Restangular', '$localStorage', '$interval',
    function ($log, DB, DB_CONFIG, $q, SettingsService, Restangular, $localStorage, $interval) {
      var self = this;
      var entityId;
      var macId;
      var enableAutoUpload = true;

      self.getBills = function () {
        entityId = SettingsService.getEntityId();
        macId = SettingsService.getMachineId();
        return DB.select(DB_CONFIG.tableNames.bill.header, '*', {
          columns: 'IsExported=?',
          data: [false]
        }, null, '10').then(function (res) {
          var promises = [];
          angular.forEach(DB.fetchAll(res), function (header) {
            header.EntityId = entityId;
            promises.push($q.all({
              BillHeader: $q.when(header),
              BillDetail: DB.select(DB_CONFIG.tableNames.bill.detail, '*', {
                columns: 'IsExported=? AND DocNo=?',
                data: [false, header.DocNo]
              }).then(onSuccess),
              BillDiscounts: DB.select(DB_CONFIG.tableNames.discounts.billDiscounts, '*', {
                columns: 'IsExported=? AND DocNo=?',
                data: [false, header.DocNo]
              }).then(onSuccess),
              PayTrans: DB.select(DB_CONFIG.tableNames.bill.payTransactions, '*', {
                columns: 'IsExported=? AND DocNo=?',
                data: [false, header.DocNo]
              }).then(onSuccess),
              PayTransOverTender: DB.select(DB_CONFIG.tableNames.bill.payTransactionsOverTender, '*', {
                columns: 'IsExported=? AND DocNo=?',
                data: [false, header.DocNo]
              }).then(onSuccess),
              StockTransactions: DB.select(DB_CONFIG.tableNames.bill.stockTransactions, '*', {
                columns: 'IsExported=? AND DocNo=?',
                data: [false, header.DocNo]
              }).then(onSuccess)
            }));
          });
          return $q.all(promises);
          // .then(function());
        });
      }

      var onSuccess = function (res) {
        return _.map(DB.fetchAll(res), function (row) {
          row.EntityId = entityId;
          row.MachineId = macId;
          return row;
        });
      }

      self.setExported = function (DocNo) {
        DB.clearQueue();
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.header, {IsExported: true}, {columns: 'DocNo=?', data: [DocNo]});
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.detail, {IsExported: true}, {columns: 'DocNo=?', data: [DocNo]});
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.payTransactions, {IsExported: true}, {
          columns: 'DocNo=?',
          data: [DocNo]
        });
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.payTransactionsOverTender, {IsExported: true}, {
          columns: 'DocNo=?',
          data: [DocNo]
        });
        DB.addUpdateToQueue(DB_CONFIG.tableNames.discounts.billDiscounts, {IsExported: true}, {
          columns: 'DocNo=?',
          data: [DocNo]
        });
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.stockTransactions, {IsExported: true}, {
          columns: 'DocNo=?',
          data: [DocNo]
        });
        return DB.executeQueue();
      }

      self.upload = function () {
        return self.getBills().then(function (bills) {
          var promises = [];
          angular.forEach(bills, function (bill) {
            var DocNo = bill.BillHeader.DocNo;
            bill.BillHeader = [bill.BillHeader];
            promises.push(post(bill).then(function (res) {
              if (res == 'success') {
                return self.setExported(DocNo);
              } else {
                return $q.reject(res);
              }
            }));
          });
          return $q.all(promises);
        });
      }

      self.startAutoUpload = function () {
        if(enableAutoUpload){
          // console.log('auto upload started');
          $interval(function() {
            // console.log('upload');
            self.upload();
          }, 120000);
        }
      }

      var post = function (data) {
        var config = $localStorage.itouchConfig;
        if(config && config.baseUrl){
          return Restangular.oneUrl("uplink", config.baseUrl+'UpdateBill').customPOST(
            JSON.stringify(data),
            '', {},
            {
              // Authorization:'Basic ' + client,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          );
        }

      }

      return self;
    }]);
