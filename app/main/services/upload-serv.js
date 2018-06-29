
angular.module('itouch.services')
  .service('UploadService', ['DB', 'DB_CONFIG', '$q', 'SettingsService', 'Restangular', '$localStorage', '$interval',
    function (DB, DB_CONFIG, $q, SettingsService, Restangular, $localStorage, $interval) {
      var self = this;
      var entityId;
      var macId;
      var enableAutoUpload = true;
      var uploadLog = new debugout();
      var autouploadInterval = 5;
      var autoupinterval = ((autouploadInterval*60)*1000);
      var interval = null;

      self.StartuploadLog = function() {
        return uploadLog;
      }

      self.getAutoUploadInterval = function() {
        return autouploadInterval;
      }

      self.setAutoUploadInterval = function (upinterval) {
        autouploadInterval = upinterval;
        autoupinterval = ((autouploadInterval*60)*1000);
        if (angular.isDefined(interval)) {
          $interval.cancel(interval);
        }
        self.startAutoUpload();
      }

      var onSuccess = function (res) {
        return _.map(DB.fetchAll(res), function (row) {
          row.EntityId = entityId;
          row.MachineId = macId;
          return row;
        });
      };

      var postVoidDocNos = function (data) {
        // console.log(data);
        var config = $localStorage.itouchConfig;
        // console.log(config);
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
          uploadLog.log('--*-- Upload Detail Initialized --*--', 7);
          uploadLog.log('  Number of transactions : ' + res.rows.length, 2);
          // console.log(res.rows.length);
          var promises = [];
          angular.forEach(DB.fetchAll(res), function (header) {
            uploadLog.log('  DocNo : ' + header.DocNo + ', Total : ' + Math.floor(header.SubTotal), 2);
            
            // console.log(header);
            // console.log(header.EntityId);
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
          uploadLog.log('--*-- Upload Detail Completed --*--', 7);

          promises.push($q.all({
            UpdateVoidDocNo: DB.select(DB_CONFIG.tableNames.bill.header, '*', {
              columns: 'IsExported=? AND VoidDocNo<>?',
              data: [true, strEmpty]
            }, null, '1000').then(onSuccess)
          }));
          uploadLog.log('Upload status : Return promised', 7);

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
        uploadLog.clear();
        uploadLog.log('Uploading Status : ' + uploading, 2);
        if (!uploading) {
          uploading = true;
          DB.clearQueue();
          uploadLog.log('Upload Status : clearQueue', 2);
          return self.getBills().then(function (bills) {
            var promises = [];  
            angular.forEach(bills, function (bill) {
              if (bill.BillDetail != undefined) {
                angular.forEach(bill.BillDetail, function (ids) {
                  console.log('Before : ' + ids.ItemId);
                  ids.ItemId = Math.floor(ids.ItemId);
                  console.log('After : '+ ids.ItemId);
                });
              }
              if (typeof (bill.BillHeader) !== 'undefined') {
                var DocNo = bill.BillHeader.DocNo;
                bill.BillHeader = [bill.BillHeader];
                promises.push(post(bill).then(function (res) {
                  if (res === 'success') {
                    uploadLog.log('Upload Status : Uploaded DocNo = ' + DocNo, 2);
                    return self.setExported(DocNo);
                  }
                  else {
                    uploadLog.log('Upload Status : Rejected' + res, 4);
                    return $q.reject(res);
                  }
                }));
              }
              else {
                promises.push(postVoidDocNos(bill).then(function (res) {
                  uploadLog.log('Upload Status : UpdateVoidDoc = ' + res, 2);
                  console.log('UpdateVoidDocNo : ' + res);
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
                uploadLog.log('Upload Error : Unable to connect the server', 4);
                return $q.reject('Unable to connect the server');
              }).finally(function () {
                uploading = false;
              });
          });
        } else {
          uploadLog.log('Upload Error : Upload stopped', 4);
          return $q.resolve();
        }

      };

      self.startAutoUpload = function () {
        console.log(enableAutoUpload);
        if (enableAutoUpload == true) {
          interval = $interval(function () { 
            console.log('auto upload');
            self.upload();
            setTimeout (function () {
              uploadLog.log('Upload Success : Auto Upload, Upload Interval : ' + autouploadInterval + ' mins', 2);
              uploadLog.log('-----*-----*-----', 7);
              var uploadlog = localStorage.getItem('UploadLogs');
              var logs = uploadLog.getLog();
              localStorage.setItem('UploadLogs', uploadlog + logs);
            }, 100)
          }, autoupinterval);
        }
      };
    
      var post = function (data) {
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
