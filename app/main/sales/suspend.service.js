/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory("SuspendService", ['$log', 'DB', 'DB_CONFIG', '$q', 'SettingsService', 'Restangular', '$localStorage', '$interval', 'TempBillHeaderService', 'TempBillDetailService', 'TempBillDiscountsService', 'BillService', 'ControlService',
      function ($log, DB, DB_CONFIG, $q, SettingsService, Restangular, $localStorage, $interval, TempBillHeaderService, TempBillDetailService, TempBillDiscountsService, BillService, ControlService) {
      var self = this;

        var self = this;
        var entityId;
        var macId;
        var enableAutoUpload = true;

        self.getBill = function (DocNo) {
            entityId = SettingsService.getEntityId();
            macId = SettingsService.getMachineId();
            return DB.select(DB_CONFIG.tableNames.bill.tempHeader, '*', {
                columns: 'DocNo=?',
                data: [DocNo]
            }, null, '1').then(function (res) {
                var promises = [];
                var header = DB.fetch(res);
                header.EntityId = entityId;
                promises.push($q.all({
                    SuspendBillHeader: $q.when(header),
                    SuspendBillDetail: DB.select(DB_CONFIG.tableNames.bill.tempDetail, '*', {
                        columns: 'DocNo=?',
                        data: [DocNo]
                    }).then(onSuccess),
                    SuspendBillDiscounts: DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, '*', {
                        columns: 'DocNo=?',
                        data: [DocNo]
                    }).then(onSuccess)
                }));

                return $q.all(promises).then(function (res) {
                    bill = _.first(res);
                    bill.SuspendNo = null;
                    bill.SuspendBillDetail = _.map(bill.SuspendBillDetail, function (item) {
                       if(item.SuspendDepDocNo){
                           bill.SuspendNo = item.SuspendDepDocNo;
                       }
                       return item;
                    });
                    bill.SuspendBillHeader = [bill.SuspendBillHeader];
                    return bill;
                });
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

        self.removeBill = function (DocNo) {
            DB.clearQueue();
            DB.addDeleteToQueue(DB_CONFIG.tableNames.bill.tempHeader, {columns: 'DocNo=?', data: [DocNo]});
            DB.addDeleteToQueue(DB_CONFIG.tableNames.bill.tempDetail, {columns: 'DocNo=?', data: [DocNo]});
            DB.addDeleteToQueue(DB_CONFIG.tableNames.discounts.tempBillDiscounts, {columns: 'DocNo=?', data: [DocNo]});
            return DB.executeQueue();
        }

        self.suspend = function (DocNo) {
            return self.getBill(DocNo).then(function (bill) {
               var promises = [];
                // angular.forEach(bills, function (bill) {
                    var DocNo = bill.SuspendBillHeader.DocNo;

                    // bill.SuspendNo = "S98564";
                    promises.push(post(bill).then(function (res) {
                        if (res == 'success') {
                            return self.removeBill(DocNo);
                        } else {
                            return $q.reject(res);
                        }
                    }));
                // });
                return $q.all(promises)
                    .catch(function(err){
                        console.log(err);
                        return $q.reject(err);
                    });
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
                return Restangular.oneUrl("uplink", config.baseUrl+'UpdateSuspendBill').customPOST(
                    JSON.stringify(data),
                    '', {},
                    {
                        // Authorization:'Basic ' + client,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                );
            }

        }

        self.fetchSuspendedBills = function(){
            return Restangular.one("GetSuspendHeaders").get().then(function (res) {
                var bills = JSON.parse(res);
                if (bills && bills.length > 0) {
                    return bills;
                } else {
                    return $q.reject("Unable to fetch suspended bills");
                }
            });
        }

        self.recallBill = function (DocNo) {
            return Restangular.one("GetSuspendBill").get({DocNo: DocNo}).then(function (res) {
                var bills = JSON.parse(res);
                var header = _.first(bills.DBSuspendBillHeader);
                if(header){
                    DB.clearQueue();
                    _.forEach(bills.DBSuspendBillDetail, function (item) {
                        item.SuspendDepDocNo = angular.copy(header.DocNo);
                        item.BusinessDate = ControlService.getBusinessDate(true);
                        item.DocNo = BillService.getCurrentReceiptId();
                        TempBillDetailService.insert(item.DocNo, item, true);
                    });
                    _.forEach(bills.DBSuspendBillDiscounts, function (discount) {
                      discount.BusinessDate = ControlService.getBusinessDate(true);
                      discount.DocNo = BillService.getCurrentReceiptId();
                      TempBillDiscountsService.insert(discount, true);
                    });
                    header.BusinessDate = ControlService.getBusinessDate(true);
                    header.DocNo = BillService.getCurrentReceiptId();
                    TempBillHeaderService.update(header.DocNo, header, true);

                    return DB.executeQueue();
                }


            });
        }

      return self;
    }
  ]);
