'use strict';
angular.module('itouch.services')
  .service('UploadService', ['$log', 'DB', 'DB_CONFIG', '$q', 'SettingsService', 'Restangular', '$localStorage', '$interval',
    function ($log, DB, DB_CONFIG, $q, SettingsService, Restangular, $localStorage, $interval) {
      var self = this;
      var entityId;
      var macId;
      var enableAutoUpload = true;

      var onSuccess = function (res) {
        return _.map(DB.fetchAll(res), function (row) {
          row.EntityId = entityId;
          row.MachineId = macId;
          return row;
        });
      };

      var postVoidDocNos = function (data) {
        var config = $localStorage.itouchConfig;
        if (config && config.baseUrl) {
          return Restangular.oneUrl('uplink', config.baseUrl + 'UpdateVoidDocNos').customPOST(
            JSON.stringify(data),
            '', {},
            {
              // Authorization:'Basic ' + client,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          );
        }
      };

      self.getBillsOld = function () {
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
      };

      self.getBills = function () {
        var strEmpty = '';
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
              /*StockTransactions: DB.select(DB_CONFIG.tableNames.bill.stockTransactions, '*', {
                columns: 'IsExported=? AND DocNo=?',
                data: [false, header.DocNo]
              }).then(onSuccess)*/
              StockTransactions: DB.selectGroupBy(DB_CONFIG.tableNames.bill.stockTransactions, ' LocationId,MachineId,BusinessDate, DocNo, ItemId, SeqNo, DocType, SUM(Qty) AS Qty,  BaseUOMId,AVG(StdCost) AS StdCost  ', {
                columns: 'IsExported=? AND DocNo=?',
                data: [false, header.DocNo]
              }, 'LocationId,MachineId,BusinessDate, DocNo, ItemId, SeqNo, DocType, BaseUOMId').then(onSuccess)
              ,
              VoidItems: DB.select(DB_CONFIG.tableNames.bill.voidItems, '*', {
                columns: 'IsExported=? AND DocNo=?',
                data: [false, header.DocNo]
              }).then(onSuccess),
              /*UpdateVoidDocNo : DB.select(DB_CONFIG.tableNames.bill.header, '*', {
                columns: 'IsExported=? AND VoidDocNo<>?',
                data: [true,strEmpty]
              },null,'1000')*/
            }));
          });

          promises.push($q.all({
            UpdateVoidDocNo: DB.select(DB_CONFIG.tableNames.bill.header, '*', {
              columns: 'IsExported=? AND VoidDocNo<>?',
              data: [true, strEmpty]
            }, null, '1000').then(onSuccess)
          }));

          return $q.all(promises);
          // .then(function());
        });
      };


      self.setExported = function (DocNo) {
        //DB.clearQueue();
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
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.voidItems, {IsExported: true}, {
          columns: 'DocNo=?',
          data: [DocNo]
        });
        return DB.executeQueue();
      };

      var uploading = false;
      self.upload = function () {
        if (!uploading) {
          console.log('3');
          uploading = true;
          DB.clearQueue();
          console.log('2');
          return self.getBills().then(function (bills) {
            console.log(bills);
            var promises = [];
            console.log('1');
            angular.forEach(bills, function (bill) {
              console.log(bill);
              console.log(bill.BillHeader);
              if (typeof (bill.BillHeader) !== 'undefined') {
                var DocNo = bill.BillHeader.DocNo;
                bill.BillHeader = [bill.BillHeader];
                promises.push(post(bill).then(function (res) {
                  console.log(res);
                  if (res === 'success') {
                    return self.setExported(DocNo);
                  }
                  else {
                    return $q.reject(res);
                  }
                }));
              }
              else {
                promises.push(postVoidDocNos(bill).then(function (res) {
                  console.log('UpdateVoidDocNo' + res);
                }));
              }

                /*
                console.log("uploading bill");
                console.log(bills);
                  angular.forEach(bills, function (bill) {
                    var DocNo = bill.BillHeader.DocNo;
                    bill.BillHeader = [bill.BillHeader];
                    promises.push(post(bill).then(function (res) {
                      //return self.setExported(DocNo);
                      /*if (res == 'success') {
                          return self.setExported(DocNo);
                        } else {
                            return $q.reject(res);
                        }*
                }));*/
            });
            return $q.all(promises)
                    .catch(function (err) {
                      console.log(err);
                      return $q.reject('Unable to connect the server');
                    }).finally(function () {
                      uploading = false;
                    });
          });
        } else {
          return $q.resolve();
        }

      };

      self.startAutoUpload = function () {
        if (enableAutoUpload) {
         //console.log('auto upload started');
          $interval(function () {
            console.log('auto upload');
            self.upload();
          }, 120000);
        }
      };

      var post = function (data) {
        console.log('BusinessDate');
        console.log(data);
        var config = $localStorage.itouchConfig;
        if (config && config.baseUrl) {
          return Restangular.oneUrl('uplink', config.baseUrl + 'UpdateBill').customPOST(
            JSON.stringify(data),
            '', {},
            {
              // Authorization:'Basic ' + client,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          );
        }

      };


      return self;
    }]);
