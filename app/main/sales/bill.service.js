/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory("BillService", ['LocationService', 'ControlService', '$localStorage', 'ErrorService', 'DB', 'DB_CONFIG', 'TenderService', 'SettingsService', '$filter', 'AuthService', '$q', 'ShiftService', 'TempBillDetailService', 'VoidItemsService', 'TempBillDiscountsService', 'TempBillHeaderService',
    function (LocationService, ControlService, $localStorage, ErrorService, DB, DB_CONFIG, TenderService, SettingsService, $filter, AuthService, $q, ShiftService, TempBillDetailService, VoidItemsService, TempBillDiscountsService, TempBillHeaderService) {
      var self = this;
      var bill = {
        header: null,
        items: [],
        payTransaction: []
      }
      var header = null;
      var items = [];
      var payTransactions = [];
      var businessDate = ControlService.getBusinessDate(true);
      var payTransactionColumnList = ['BusinessDate','LocationId', 'MachineId', 'DocNo', 'Cash', 'SeqNo', 'PayTypeId', 'Amount', 'ChangeAmount',
        'ConvRate', 'CurrencyId', 'Remarks', 'IsExported'];
      var stockTransactionColumnList = ['LocationId', 'BusinessDate', 'DocNo', 'ItemId', 'LineNumber', 'SeqNo', 'DocType', 'Qty',
        'StdCost', 'BaseUOMId', 'IsExported'];
      var billColumnList = ['BusinessDate','LocationId', 'MachineId', 'DocNo', 'PluType', 'KitType', 'ItemId', 'LineNumber', 'OrderedDateTime',
        'SuspendDepDocNo', 'OrderedBy', 'SpecialOrderRemark', 'ServingTime', 'TakeAway', 'ItemType', 'ParentItemLineNumber', 'PromoPwpId',
        'PriceLevelId', 'StdCost', 'OrgPrice', 'AlteredPrice', 'WaCost', 'Price', 'Qty', 'SubTotal', 'DiscAmount', 'Tax1DiscAmount',
        'Tax2DiscAmount', 'Tax3DiscAmount', 'Tax4DiscAmount', 'Tax5DiscAmount', 'Tax1Amount','Tax2Amount','Tax3Amount','Tax4Amount','Tax5Amount','Tax1Option', 'DepAmount',
        'Tax2Option', 'Tax3Option', 'Tax4Option', 'Tax5Option', 'Tax1Perc', 'Tax2Perc', 'Tax3Perc', 'Tax4Perc', 'Tax5Perc', 'NoDiscount',
        'ByAmount', 'CurCode', 'BuyRate', 'ReasonId', 'RefCode', 'Remark', 'MultiDiscount', 'PriceChanged', 'Taxable', 'BelowCost', 'Comm', 'Desc1', 'Desc2', 'Selectable', 'parentItemLineNumber'];

      var headerColumnList = ['BusinessDate','LocationId', 'MachineId', 'DocNo', 'DocType', 'SysDateTime', 'VoidDocNo', 'TableId',
        'SuspendDepDocNo', 'OrderedBy', 'SpecialOrderRemark', 'ServingTime', 'TakeAway', 'ItemType', 'ParentItemLineNumber', 'PromoPwpId',
        'Pax', 'ShiftId', 'VipId', 'CashierId', 'StaffId', 'AuthBy', 'SubTotal', 'DepAmount', 'DiscAmount', 'Tax1DiscAmount',
        'Tax2DiscAmount', 'Tax3DiscAmount', 'Tax4DiscAmount', 'Tax5DiscAmount', 'Tax1Amount','Tax2Amount','Tax3Amount','Tax4Amount','Tax5Amount','Tax1Option',
        'Tax2Option', 'Tax3Option', 'Tax4Option', 'Tax5Option', 'Tax1Perc', 'Tax2Perc', 'Tax3Perc', 'Tax4Perc', 'Tax5Perc', 'ReprintCount',
        'Remarks', 'OrderTag', 'IsExported', 'IsClosed'];


      self.generateReceiptId = function () {
        return ControlService.getNextDocId();
      }

      self.saveReceiptId = function (docNo) {
        // console.log(docNo);
        ControlService.saveDocId(docNo);
        // console.log(ControlService.getNextDocId());
      }

      self.getCurrentReceiptId = function () {
        return ControlService.getDocId();
      }

      var location = LocationService.currentLocation;
      renameProperty(location, 'PriceLevel', 'PriceLevelId');
      renameProperty(location, 'Id', 'LocationId');
      // console.log(location);
      if (!location) {
        LocationService.get().then(function (loc) {
          if(loc){
            location = loc;
            renameProperty(location, 'PriceLevel', 'PriceLevelId');
            renameProperty(location, 'Id', 'LocationId');
          } else {

          }
        });
      }


      self.createTempHeader = function (totals) {
        if(!location){
          location = angular.copy(LocationService.currentLocation);
        }
        if(location){
          bill.header = {};
          bill.header.DocNo = self.getCurrentReceiptId();
          bill.header.DocType = TenderService.getDocType();
          bill.header.LocationId = SettingsService.getLocationId();
          bill.header.MachineId = SettingsService.getMachineId();
          bill.header.BusinessDate = ControlService.getBusinessDate(true);
          bill.header.SysDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
          bill.header.ShiftId = ShiftService.getCurrentId();
          bill.header.AuthBy = 0;
          bill.header.VipId = 0;
          bill.header.CashierId = AuthService.currentUser() ? AuthService.currentUser().Id : null;
          bill.header.TableId = 0;
          bill.header.DepAmount = 0;
          bill.header.VoidDocNo = "";
          bill.header.ReprintCount = 0;
          bill.header.OrderTag = "";
          bill.header.Remarks = "";
          bill.header.IsClosed = false;
          bill.header.StaffId = 0;
          bill.header.Pax = 0;

          bill.header.Tax1Option = location.Tax1Option;
          bill.header.Tax1Perc = location.Tax1Perc;
          bill.header.Tax2Option = location.Tax2Option;
          bill.header.Tax2Perc = location.Tax2Perc;
          bill.header.Tax3Option = location.Tax3Option;
          bill.header.Tax3Perc = location.Tax3Perc;
          bill.header.Tax4Option = location.Tax4Option;
          bill.header.Tax4Perc = location.Tax4Perc;
          bill.header.Tax5Option = location.Tax5Option;
          bill.header.Tax5Perc = location.Tax5Perc;
          if(totals){
            bill.header = _.extend(header, totals);
          } else{
            bill.header.SubTotal = 0;
            bill.header.DepAmount = 0;
            bill.header.DiscAmount = 0;
            bill.header.Tax1DiscAmount = 0;
            bill.header.Tax2DiscAmount = 0;
            bill.header.Tax3DiscAmount = 0;
            bill.header.Tax4DiscAmount = 0;
            bill.header.Tax5DiscAmount = 0;
            bill.header.Tax1Amount = 0;
            bill.header.Tax2Amount = 0;
            bill.header.Tax3Amount = 0;
            bill.header.Tax4Amount = 0;
            bill.header.Tax5Amount = 0;
          }

          return DB.insert(DB_CONFIG.tableNames.bill.tempHeader, bill.header).then(function () {
            ControlService.saveDocId(bill.header.DocNo);
            return true;
          });
        } else {
          return $q.reject("Location not selected");
        }
      }

      var updateTempHeader = function (header) {
        return DB.update(DB_CONFIG.tableNames.bill.tempHeader, header, { columns: ' DocNo = ?', data: [header.DocNo]});
      }

      self.initHeader = function () {
        return self.createTempHeader().then(function(success){
          return self.getTempHeader();
        });
      }
      // initHeader();

      var initItems = function () {
        // var DocNo = TenderService.generateReceiptId();
        return DB.select(DB_CONFIG.tableNames.bill.tempDetail, "*").then(function (res) {
          return DB.fetchAll(res);
        });
      }
      initItems();

      // self.getTempHeader = function () {
      //   return initHeader();
      // }

      self.getItems = function () {
        return initItems();
      }

      var calculateTotal = function (docNo) {
        var totals = {
          SubTotal: 0,
          Tax1Amount: 0,
          Tax2Amount: 0,
          Tax3Amount: 0,
          Tax4Amount: 0,
          Tax5Amount: 0,
          Tax1DiscAmount: 0,
          Tax2DiscAmount: 0,
          Tax3DiscAmount: 0,
          Tax4DiscAmount: 0,
          Tax5DiscAmount: 0,
          DiscAmount: 0,
          Pax: 0
        };
        return DB.select(DB_CONFIG.tableNames.bill.tempDetail, 'SubTotal, Tax1Amount, Tax2Amount, Tax3Amount, Tax4Amount, Tax5Amount',
          { columns: 'DocNo = ?', data: [docNo]}).then(function (res) {
          var items = DB.fetchAll(res);
          angular.forEach(items, function (item) {
            // if(item.ItemType == 'NOR' || item.ItemType == 'SKT'){
              totals.SubTotal += (parseFloat(item.SubTotal)).roundTo(2);
              totals.Pax++;
              totals.Tax1Amount += (parseFloat(item.Tax1Amount)).roundTo(2);
              totals.Tax2Amount += (parseFloat(item.Tax2Amount)).roundTo(2);
              totals.Tax3Amount += (parseFloat(item.Tax3Amount)).roundTo(2);
              totals.Tax4Amount += (parseFloat(item.Tax4Amount)).roundTo(2);
              totals.Tax5Amount += (parseFloat(item.Tax5Amount)).roundTo(2);
              totals.DiscAmount += (parseFloat(item.Tax1DiscAmount||0)).roundTo(2);
              totals.DiscAmount += (parseFloat(item.Tax2DiscAmount||0)).roundTo(2);
              totals.DiscAmount += (parseFloat(item.Tax3DiscAmount||0)).roundTo(2);
              totals.DiscAmount += (parseFloat(item.Tax4DiscAmount||0)).roundTo(2);
              totals.DiscAmount += (parseFloat(item.Tax5DiscAmount||0)).roundTo(2);
            // }
          });
          totals.SubTotal = totals.SubTotal.roundTo(2);
          totals.Tax1Amount = totals.Tax1Amount.roundTo(2);
          totals.Tax2Amount = totals.Tax2Amount.roundTo(2);
          totals.Tax3Amount = totals.Tax3Amount.roundTo(2);
          totals.Tax4Amount = totals.Tax4Amount.roundTo(2);
          totals.Tax5Amount = totals.Tax5Amount.roundTo(2);

          if(header){
            header.SubTotal = totals.SubTotal;
            header.Tax1Amount = totals.Tax1Amount;
            header.Tax2Amount = totals.Tax2Amount;
            header.Tax3Amount = totals.Tax3Amount;
            header.Tax4Amount = totals.Tax4Amount;
            header.Tax5Amount = totals.Tax5Amount;
          }
          return totals;
        });
      }

      self.addPayTransaction = function (tenderTypeId, cash, amount, changeAmount) {
        var pTrans = {
          BusinessDate: businessDate,
          LocationId: SettingsService.getLocationId(),
          MachineId: SettingsService.getMachineId(),
          DocNo: ControlService.getDocId(),
          // DocNo: bill.header.DocNo,
          Cash: cash == 'true',
          SeqNo: 0,
          PayTypeId: tenderTypeId,
          Amount: amount,
          ChangeAmount: changeAmount,
          ConvRate: 0,
          CurrencyId: 0,
          IsExported: true
        };
        payTransactions.push(pTrans);
        return DB.insert(DB_CONFIG.tableNames.bill.tempPayTrans, pTrans);
      }

      var saveItemToDB = function (item) {
        return DB.insert(DB_CONFIG.tableNames.bill.tempDetail, self.calculateTax(item));
      }

      self.loadLineNewNumber = function (parentNumber) {
        var where = null;
        if(parentNumber){
          where = {
            columns: 'ParentItemLineNumber=?',
            data: [parentNumber]
          }
        }
        return DB.max(DB_CONFIG.tableNames.bill.tempDetail, 'LineNumber', where).then(function (ln) {
          if(parentNumber){
            if(ln == 0){
              return ++parentNumber;
            } else {
              return ln++;
            }
          } else {
            return (ln - (ln%100)) + 100;
          }
        }, function(ex){
          console.log(ex);
        });
      };

      self.addItem = function (item) {
        var def = $q.defer();
        item = prepareItem(item);
        var errors = validateBill(item);
        if (errors.length == 0) {
          var itemPromise = null;
          if(!item.LineNumber){
            itemPromise =  self.loadLineNewNumber().then(function (ln) {
              item.LineNumber = ln;
              itemPromise = saveItemToDB(item);
            });
          }else {
            itemPromise = saveItemToDB(item);
          }
          return itemPromise.then(function(){
            return self.updateHeaderTotals(item.DocNo).then(function(){
              return item;
            });
          });
        } else {
          ErrorService.add(errors);
          def.reject("Invalid Item");
        }
        return def.promise;
      }

      self.updateItem = function (item) {
        var def = $q.defer();
        item = prepareItem(item);
        item = self.calculateTax(item);
        var errors = validateBill(item);
        if (errors.length == 0) {
          DB.update(DB_CONFIG.tableNames.bill.tempDetail, item, {columns: 'ItemId=? AND DocNo=? AND LineNumber=?',
            data:[item.ItemId, item.DocNo, item.LineNumber] }).then(function(){
              self.updateHeaderTotals(item.DocNo).then(function(){
                def.resolve(item);
              });
          });
        } else {
          ErrorService.add(errors);
          console.log(errors);
          def.reject("invalid item "+item.ItemId);
        }


        return def.promise;
      }


      self.addSalesKitItem = function (item) {
        renameProperty(item, 'Id', 'ItemId');
        item.ItemType = 'SKT';
        DB.clearQueue();
        var def = $q.defer();
        return self.loadLineNewNumber().then(function (ln) {
          var success = function () {
            // BillService.saveReceiptId(bill.header.DocNo);
          };
          item.LineNumber = ln;
          item.ParentItemLineNumber = 0;
          angular.forEach(item.selectedList, function (sKItem) {
            sKItem.LineNumber = ln += 100;
            sKItem.ItemType = "SKI";
            sKItem.ParentItemLineNumber = item.LineNumber;
            sKItem.Price = sKItem.AdditionalPrice ? sKItem.AdditionalPrice : 0;
            sKItem = prepareItem(sKItem);
            sKItem = self.calculateTax(sKItem);
            var errors = validateBill(sKItem);
            if (errors.length == 0) {
              DB.addInsertToQueue(DB_CONFIG.tableNames.bill.tempDetail, sKItem);
            } else {
              $q.reject("invalid item "+sKItem.ItemId);
              ErrorService.add(errors);
              console.log(errors);
            }
          });
          item = prepareItem(item);
          item = self.calculateTax(item);
          DB.addInsertToQueue(DB_CONFIG.tableNames.bill.tempDetail, _.omit(item, ['selected', 'selectedList', 'list']));
          return DB.executeQueue().then(function () {
            // console.log("items");
            return self.updateHeaderTotals(item.DocNo);
          });
        });

        return def.promise;
      }

      self.updateSalesKitItem = function (item, itemId) {
        DB.clearQueue();
        var def = $q.defer();
        return DB.max(DB_CONFIG.tableNames.bill.tempDetail, 'LineNumber').then(function (ln) {
          var success = function () {
            // BillService.saveReceiptId(bill.header.DocNo);
          };

          if (!item.Qty) {
            item.Qty = 1;
          }
          renameProperty(item, 'Id', 'ItemId');
          item.ItemType = 'SKI';
          item.ItemType = item.ItemType || "SKI";
          item.ParentItemLineNumber = item.ParentItemLineNumber|| 0;
          item = prepareItem(item);
          item = self.calculateTax(item);
          console.log(item);
          DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.tempDetail, _.omit(item, 'Selections'), { columns: 'LineNumber=? AND ItemId=? AND DocNo=?', data: [item.LineNumber, itemId, item.DocNo]});

          return DB.executeQueue().then(function () {
            return self.updateHeaderTotals(item.DocNo);
          });
        });

        return def.promise;
      }

      self.saveBill = function (billHeader, billDetails, stockTransactions, payTransactions, payTransactionsOverTender) {
        var deferred = $q.defer();
        if(!stockTransactions){
          stockTransactions = [];
        }
        if(!payTransactions){
          payTransactions = [];
        }
        if(!payTransactionsOverTender){
          payTransactionsOverTender = [];
        }

        stockTransactions = _.map(stockTransactions, function (item) {
          return _.pick(item, stockTransactionColumnList);
        });

        payTransactions = _.map(payTransactions, function (item) {
          item = _.pick(item, payTransactionColumnList);
          return item;
        });

        self.getTempBill(bill.header.DocNo).then(function(bill){
          bill.header.IsExported = false;
          bill.header.DocType = billHeader.DocType || 'SA';
          bill.items = _.map(bill.items, function (item) {
            // item = _.pick(item, billColumnList);
            item.IsExported = false;
            return _.omit(item, 'Selectable');
          });

          bill.discounts = _.map(bill.discounts, function (item) {
            item.IsExported = false;
            return item;
          });
          DB.clearQueue();
          billHeader.IsExported = false;
          billHeader.IsClosed = false;
          DB.addInsertToQueue(DB_CONFIG.tableNames.bill.header, _.pick(billHeader, headerColumnList));
          DB.addInsertToQueue(DB_CONFIG.tableNames.bill.detail, bill.items);
          DB.addInsertToQueue(DB_CONFIG.tableNames.bill.stockTransactions, stockTransactions);
          DB.addInsertToQueue(DB_CONFIG.tableNames.bill.payTransactions, payTransactions);
          DB.addInsertToQueue(DB_CONFIG.tableNames.discounts.billDiscounts, bill.discounts);
          if(payTransactionsOverTender){
            DB.addInsertToQueue(DB_CONFIG.tableNames.bill.payTransactionsOverTender, payTransactionsOverTender);
          }

          DB.executeQueue().then(function () {
            clearTempBillHeader();
            clearTempBillDetails();
            clearTempDicounts();
            DB.clearQueue();
            ControlService.counterDocId(bill.header.DocNo);
            deferred.resolve();
          }, function (err) {
            deferred.reject(err);
          });
        }, function(err){
          console.log(err);
          deferred.reject(err);
        });

        return deferred.promise;
      }

      self.getCurrentBill = function () {
        DB.select(DB_CONFIG.tableNames.bill.tempDetail, '*', undefined, 1).then(function (result) {
          var bill = DB.fetchAll(result);
          return bill;
        }, function (error) {
          throw new Error(error.message);
        });
      }


      /**
       * TODO filter
       * @returns {Promise.<TResult>|*}
       */
      self.getTempHeader = function(DocNo){
        var where;
        if(DocNo){
          where = { columns: ' DocNo=? ', data: [DocNo] };
        }
        return DB.select(DB_CONFIG.tableNames.bill.tempHeader, '*', where).then(function(rs){
          return bill.header = DB.fetch(rs);
        });
      }

      self.getTempItems = function(docNo){
        return DB.select(DB_CONFIG.tableNames.bill.tempDetail, '*', { columns: 'DocNo=?', data: [docNo||ControlService.getDocId()] }).then(function(rs){
          return DB.fetchAll(rs);
        });
      }

      self.getTransactions = function(docNo){
        return DB.select(DB_CONFIG.tableNames.bill.payTransactions, '*', { columns: 'DocNo=?', data: [docNo||ControlService.getDocId()] }).then(function(rs){
          return DB.fetchAll(rs);
        });
      }

      self.getDiscounts = function(docNo){
        return DB.select(DB_CONFIG.tableNames.discounts.billDiscounts, '*', { columns: 'DocNo=?', data: [docNo||ControlService.getDocId()] }).then(function(rs){
          return DB.fetchAll(rs);
        });
      }

        self.getTempDiscounts = function(docNo){
            return DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, '*', { columns: 'DocNo=?', data: [docNo||ControlService.getDocId()] }).then(function(rs){
                return DB.fetchAll(rs);
            });
        }

      self.getTempBill = function(docNo){
        return $q.all({
          header: self.getTempHeader(docNo),
          items: self.getTempItems(docNo),
          discounts: self.getTempDiscounts(docNo)
        });
      }

      /**
       * Calculates taxes for the given item with current location
       * @param item
       * @returns item
       */
      self.calculateTax = function (item) {
        var Tax1 = 0, Tax2 = 0, Tax3 = 0, Tax4 = 0, Tax5 = 0, SubTotal = 0, NewSubTotal = 0, Discount = 0, DiscountforTax1 = 0, DiscountforTax2 = 0, DiscountforTax3 = 0, DiscountforTax4 = 0, DiscountforTax5 = 0;
        var Takeaway = item.TakeAway;

        if (_.isNaN(item.AlteredPrice)) {
          item.AlteredPrice = parseFloat(item.AlteredPrice).roundTo(2);
        }
        if (_.isNaN(item.Qty)) {
          item.Qty = parseFloat(item.Qty);
        }
        if(!item.Price){
          item.Price = 0;
        }

        if(!item.OrgPrice) item.OrgPrice = item.Price;
        if(!item.AlteredPrice) item.AlteredPrice = item.Price;
        if(_.isUndefined(item.StdCost)) item.StdCost = 0;
        if(!item.WaCost) item.WaCost = 0;
        if(!item.DiscAmount) item.DiscAmount = 0;
        if(!item.Tax1DiscAmount || _.isNaN(item.Tax1DiscAmount)) item.Tax1DiscAmount = 0;
        if(!item.Tax2DiscAmount || _.isNaN(item.Tax2DiscAmount)) item.Tax2DiscAmount = 0;
        if(!item.Tax3DiscAmount || _.isNaN(item.Tax3DiscAmount)) item.Tax3DiscAmount = 0;
        if(!item.Tax4DiscAmount || _.isNaN(item.Tax4DiscAmount)) item.Tax4DiscAmount = 0;
        if(!item.Tax5DiscAmount || _.isNaN(item.Tax5DiscAmount)) item.Tax5DiscAmount = 0;

        if(!item.Tax1Amount || _.isNaN(item.Tax1Amount)) item.Tax1Amount = 0;
        if(!item.Tax2Amount || _.isNaN(item.Tax2Amount)) item.Tax2Amount = 0;
        if(!item.Tax3Amount || _.isNaN(item.Tax3Amount)) item.Tax3Amount = 0;
        if(!item.Tax4Amount || _.isNaN(item.Tax4Amount)) item.Tax4Amount = 0;
        if(!item.Tax5Amount || _.isNaN(item.Tax5Amount)) item.Tax5Amount = 0;

        SubTotal = (item.OrgPrice * item.Qty).roundTo(2);

        if (!item.Taxable) {
          return item;
        } else {
          Discount = item.DiscAmount + item.Tax1DiscAmount + item.Tax2DiscAmount + item.Tax3DiscAmount + item.Tax4DiscAmount + item.Tax5DiscAmount;

          var DiscountPrec = 0;
          if (Discount != 0) {
            if (SubTotal > 0) {
              DiscountPrec = (Discount / SubTotal) * 100;
            }
          }

          if (location.Tax5Option == 3) { //if tax5 has set to option 3 (inclusive in selling price) other taxes are not applicable
            var TempSub = 0;
            var TaxforNonDiscountAmount = 0;
            NewSubTotal = SubTotal - Discount;

            //Tax5 = Math.Round(SubTotal * (location.Tax5Perc / 100), 2);
            Tax5 = ((SubTotal / (100 + location.Tax5Perc)) * (location.Tax5Perc)).roundTo(2);

            if (Math.abs(Discount) > 0) {
              //Decimal DiscFromTax = Tax5 * (DiscPerc / 100);

              TaxforNonDiscountAmount = ((NewSubTotal / (100 + location.Tax5Perc)) * (location.Tax5Perc)).roundTo(2);

              DiscountforTax5 = Tax5 - TaxforNonDiscountAmount;
            } else {
              SubTotal = SubTotal - item.DiscAmount.roundTo(2);
              //NewSubTotal = SubTotal;

              //=================Tax1 calculation==================
              if (!(Takeaway && ControlService.getTakeAwayTax() == 1)) {
                if (location.Tax1Option == 1) {
                  Tax1 = (SubTotal * (location.Tax1Perc / 100)).roundTo(2);
                }
              }
              //=============end tax1 calculation===================


              //=================Tax2 calculation==================
              if (!(Takeaway && ControlService.getTakeAwayTaxPOS() == 2)) {
                if (location.Tax2Option == 1) {
                  Tax2 = (SubTotal * (location.Tax2Perc / 100)).roundTo(2);
                }
                else if (location.Tax2Option == 2) {
                  Tax2 = (SubTotal + Tax1) * (location.Tax2Perc / 100).roundTo(2);
                }
              }
              //=============end tax2 calculation===================


              //=================Tax3 calculation==================
              if (!(Takeaway && ControlService.getTakeAwayTaxPOS() == 3)) {
                if (location.Tax3Option == 1) {
                  Tax3 = (SubTotal * (location.Tax3Perc / 100)).roundTo(2);
                }
                else if (location.Tax3Option == 4) {
                  Tax3 = (SubTotal + Tax1 + Tax2) * (location.Tax3Perc / 100).roundTo(2);
                }
              }
              //=============end tax3 calculation===================


              //=================Tax4 calculation==================
              if (!(Takeaway && ControlService.getTakeAwayTaxPOS() == 4)) {
                if (location.Tax4Option == 1) {
                  Tax4 = SubTotal * (location.Tax4Perc / 100).roundTo(2);
                }
                else if (location.Tax4Option == 2) {
                  Tax4 = (SubTotal + Tax1 + Tax2 + Tax3) * (location.Tax4Perc / 100).roundTo(2);
                }
              }
              //=============end tax4 calculation===================


              //=================Tax5 calculation==================
              if (!(Takeaway && ControlService.getTakeAwayTaxPOS() == 5)) {
                if (location.Tax5Option == 1) {
                  Tax5 = (SubTotal * (location.Tax5Perc / 100)).roundTo(2);
                }
                else if (location.Tax5Option == 2) {
                  Tax5 = ((SubTotal.roundTo(2) + Tax1.roundTo(2) + Tax2.roundTo(2) + Tax3.roundTo(2) + Tax4.roundTo(2)) * (location.Tax5Perc / 100)).roundTo(2);


                }

                if (Discount > 0)
                {
                   // var DiscFromTax = (Tax5 * (DiscountPrec / 100)).roundTo(4);
                   DiscountforTax5 = (Tax5 * (DiscountPrec / 100)).roundTo(4);
                   // DiscountforTax5 = Math.Round(DiscountforTax5, 4);
                }
              }
              //=============end tax5 calculation===================
            }
            item.Tax1Amount = Tax1.roundTo(2);
            item.Tax2Amount = Tax2.roundTo(2);
            item.Tax3Amount = Tax3.roundTo(2);
            item.Tax4Amount = Tax4.roundTo(2);
            item.Tax5Amount = Tax5.roundTo(2);
            item.Tax1DiscAmount = DiscountforTax1.roundTo(2);
            item.Tax2DiscAmount = DiscountforTax2.roundTo(2);
            item.Tax3DiscAmount = DiscountforTax3.roundTo(2);
            item.Tax4DiscAmount = DiscountforTax4.roundTo(2);
            item.Tax5DiscAmount = DiscountforTax5.roundTo(2);

            if (location.Tax5Option == 3) {
              item.SubTotal = SubTotal - Tax5;
              if(item.Taxable){
                // item.OrgPrice = item.Price;
                // item.AlteredPrice = deductTax(item.Price, parseInt(location.Tax5Perc)).roundTo(2);
                // item.StdCost = item.AlteredPrice;
              }
            } else {
              // item.OrgPrice = item.Price;
              // item.AlteredPrice = item.Price;
              // item.StdCost = item.Price;

            }
            item.SubTotal = (item.SubTotal).roundTo(2);

          }
          return item;
        }
      }

      var prepareItem = function (item) {
        var loc = _.omit(location, ['Id', 'Code', "Address1", 'Address2', 'Country', 'EntityId', 'LandSize', 'PostalCode', 'ShortName', 'Tax1Desc1',
          'Tax1DepApplicable', 'Tax5Desc1', 'Tax2Desc1', 'Tax3Desc1', 'Tax4Desc1', 'Tax2DepApplicable', 'Tax1Desc2', 'Tax2Desc2', 'Tax3Desc2', 'Tax4Desc2', 'Tax5Desc2', 'Tax3DepApplicable',
        'Tax4DepApplicable', 'Tax5DepApplicable']);

        if(!_.isUndefined(item, 'Description1')){
          renameProperty(item, 'Description1', 'Desc1');
          renameProperty(item, 'Description2', 'Desc2');
        }
        item = _.extend(item, loc);


        item.OrderedBy = AuthService.currentUser() ? AuthService.currentUser().Id : 0;
        item.OrderedDateTime = item.OrderDateTime  || moment().format('YYYY-MM-DD HH:mm:ss');
        item.ParentItemLineNumber = item.ParentItemLineNumber || 0;
        item.SuspendDepDocNo = item.SuspendDepDocNo || "";
        item.TakeAway = item.TakeAway || false;
        item.ItemType = item.ItemType || 'NOR';
        item.PromoPwpId = item.PromoPwpId || 0;
        item.Comm = item.Comm || 0;
        item.PriceChanged = item.PriceChanged || false;
        item.DepAmount = item.DepAmount || 0;
        item.ByAmount = item.ByAmount || 0;
        item.KitType = item.KitType || 0;
        item.BuyRate = item.BuyRate || 0;
        item.ReasonId = item.ReasonId || 0;

        item.BusinessDate = item.BusinessDate || ControlService.getBusinessDate(true);
        item.MachineId = item.MachineId || SettingsService.getMachineId();
        item.LocationId = item.LocationId || SettingsService.setLocationId();
        item.DocNo = ControlService.getDocId();
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
        item = _.pick(item, billColumnList);
        return item;
      }

      /**
       * Validates the bill object with property names in required array and returns an errors array
       * @param bill
       * @returns {Array}
       */
      var validateBill = function (item) {
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
          errors.push("Item not found");
        }

        return errors;
      }

      /**
       * Validates the bill object with property names in required array and returns an errors array
       * @param bill
       * @returns {Array}
       */
      var validateStockTransaction = function (item) {
        var required = ['LocationId', 'MachineId', 'DocNo', 'LineNumber', 'ItemId', 'SeqNo', 'DocType', 'Qty', 'StdCost', 'BaseUOMId', 'IsExported'];
        var errors = [];
        if(item){
          angular.forEach(required, function (attribute) {
            if (_.isUndefined(item[attribute]) || item[attribute] == null) {
              errors.push("Field " + attribute + " cannot be empty");
            }
          });
        } else {
          errors.push("Item not found");
        }

        return errors;
      }

      /**
       * Validates the bill object with property names in required array and returns an errors array
       * @param bill
       * @returns {Array}
       */
      var validateSalesKit = function (skitem) {
          var required = ['LocationId', 'MachineId', 'DocNo', 'PluType', 'ItemId', 'SuspendDepDocNo', 'OrderedBy', 'TakeAway',
            'ParentItemLineNumber', 'PriceLevelId', 'Price', 'Qty', 'DepAmount', 'Tax1Option', 'Tax2Option', 'Tax3Option',
            'Tax4Option', 'Tax5Option', 'Tax1Perc', 'Tax2Perc', 'Tax3Perc', 'Tax4Perc', 'Tax5Perc', 'NoDiscount', 'MultiDiscount', 'PriceChanged', 'Taxable', 'BelowCost', 'Comm'];


          if(skitem){
            var errors = [];

            angular.forEach(required, function (attribute) {
              if (_.isUndefined(skitem[attribute]) || skitem[attribute] == null) {
                errors.push("Field " + attribute + " cannot be empty");
              }
            });
            if(skitem.Selections){
              angular.forEach(skitem.Selections, function (item) {
                angular.forEach(required, function (attribute) {
                  if (_.isUndefined(item[attribute]) || item[attribute] == null) {
                    errors.push("Field ["+skitem.LineNumber+"]" + attribute + " cannot be empty");
                  }
                });
              });
            } else {
              errors.push("Nothing selected");
            }
          } else {
            errors.push("Item not found");
          }

          return errors;
        }

      // self.getTempBill = function () {
      //   var deferred = $q.defer();
      //
      //   DB.select(DB_CONFIG.tableNames.bill.tempDetail, "*").then(function (result) {
      //     deferred.resolve(DB.fetchAll(result));
      //   }, function (err) {
      //     throw new Error(err.message);
      //     deferred.reject(err.message);
      //   });
      //
      //   return deferred.promise;
      // }

      var deductTax = function (amount, rate) {
        return (amount / (100 + rate)) * 100;
      }

      self.getBillSummary = function (bill) {
        var deferred = $q.defer();
        if(_.isUndefined(bill)){
          self.getItems().then(function (b) {
            bill = b;
            deferred.resolve(calculateSummary(b));
          }, function (err) {
            deferred.reject(err);
          });
        } else {
          deferred.resolve(calculateSummary(bill));
        }
        return deferred.promise;
      }

      var calculateSummary = function (bill) {
        var summary = {
          Pax: 0,
          SubTotal: 0,
          Tax1DiscAmount: 0,
          Tax2DiscAmount: 0,
          Tax3DiscAmount: 0,
          Tax4DiscAmount: 0,
          Tax5DiscAmount: 0,
          Tax1Amount: 0,
          Tax2Amount: 0,
          Tax3Amount: 0,
          Tax4Amount: 0,
          Tax5Amount: 0,
          DiscAmount: 0
        };
        angular.forEach(bill, function (item) {
          ++summary.Pax;
          summary.SubTotal += item.SubTotal;
          summary.Tax1DiscAmount += item.Tax1DiscAmount;
          summary.Tax2DiscAmount += item.Tax2DiscAmount;
          summary.Tax3DiscAmount += item.Tax3DiscAmount;
          summary.Tax4DiscAmount += item.Tax4DiscAmount;
          summary.Tax5DiscAmount += item.Tax5DiscAmount;
          summary.DiscAmount += item.DiscAmount;
          summary.Tax1Amount += item.Tax1Amount;
          summary.Tax2Amount += item.Tax2Amount;
          summary.Tax3Amount += item.Tax3Amount;
          summary.Tax4Amount += item.Tax4Amount;
          summary.Tax5Amount += item.Tax5Amount;
        });
        summary.SubTotal = _.isNumber(summary.SubTotal) ? summary.SubTotal.roundTo(2) : 0;
        summary.Tax1DiscAmount = _.isNumber(summary.Tax1DiscAmount) ? summary.Tax1DiscAmount.roundTo(2) : 0;
        summary.Tax2DiscAmount = _.isNumber(summary.Tax2DiscAmount) ? summary.Tax2DiscAmount.roundTo(2) : 0;
        summary.Tax3DiscAmount = _.isNumber(summary.Tax3DiscAmount) ? summary.Tax3DiscAmount.roundTo(2): 0;
        summary.Tax4DiscAmount = _.isNumber(summary.Tax4DiscAmount) ? summary.Tax4DiscAmount.roundTo(2) : 0;
        summary.Tax5DiscAmount = _.isNumber(summary.Tax5DiscAmount) ? summary.Tax5DiscAmount.roundTo(2) : 0;
        summary.Tax1Amount = _.isNumber(summary.Tax1Amount) ? summary.Tax1Amount.roundTo(2) : 0;
        summary.Tax2Amount = _.isNumber(summary.Tax2Amount) ? summary.Tax2Amount.roundTo(2) : 0;
        summary.Tax3Amount = _.isNumber(summary.Tax3Amount) ? summary.Tax3Amount.roundTo(2) : 0;
        summary.Tax4Amount = _.isNumber(summary.Tax4Amount) ? summary.Tax4Amount.roundTo(2) : 0;
        summary.Tax5Amount = _.isNumber(summary.Tax5Amount) ? summary.Tax5Amount.roundTo(2) : 0;
        summary.DiscAmount = _.isNumber(summary.DiscAmount) ? summary.DiscAmount.roundTo(2) : 0;

        // summary.DiscAmount = summary.Tax1DiscAmount + summary.Tax2DiscAmount + summary.Tax3DiscAmount + summary.Tax4DiscAmount + summary.Tax5DiscAmount;
        summary.TaxAmount = summary.Tax1Amount + summary.Tax2Amount + summary.Tax3Amount + summary.Tax4Amount + summary.Tax5Amount;
        summary.Total = (summary.SubTotal + summary.TaxAmount) - summary.DiscAmount;
        summary.TotalRounded = summary.Total.roundTo(2, 0.25);
        return summary;
      }

      var clearTempBillDetails = function () {
        return DB.query("DELETE FROM "+DB_CONFIG.tableNames.bill.tempDetail);
      }

      var clearTempBillHeader = function () {
        return DB.query("DELETE FROM "+DB_CONFIG.tableNames.bill.tempHeader);
      }

      var clearTempDicounts = function () {
        return DB.query("DELETE FROM "+DB_CONFIG.tableNames.discounts.tempBillDiscounts);
      }

      var clearVoidItems = function () {
        return DB.query("DELETE FROM "+DB_CONFIG.tableNames.bill.voidItems);
      }

      var clearQueue = true;
      self.voidItem = function (item) {
        if(item.ItemId && item.ItemType && item.LineNumber){
          DB.clearQueue();

          return TempBillDetailService.getChildItems(item.LineNumber).then(function(childItems){
            var promises = {
              'removeItem': TempBillDetailService.delete({ columns: 'ItemId=? AND ItemType=? AND LineNumber=?', data:[item.ItemId, item.ItemType, item.LineNumber] }, true),
              'removeDiscounts': TempBillDiscountsService.delete({ columns: 'ItemId=? AND LineNumber=?', data:[item.ItemId, item.LineNumber] }, true),
              'addVoidItem': VoidItemsService.insert(item, true)
            };
            if(childItems.length > 0){
              angular.forEach(childItems, function (childItem) {
                childItem.ParentItemId = item.ItemId;
                promises['Child'+childItem.ItemId+'removeItem'] = TempBillDetailService.delete({ columns: 'ItemId=? AND ItemType=? AND LineNumber=?', data:[childItem.ItemId, childItem.ItemType, childItem.LineNumber] }, true);
                promises['Child'+childItem.ItemId+'removeDiscounts'] = TempBillDiscountsService.delete({ columns: 'ItemId=? AND LineNumber=?', data:[childItem.ItemId, childItem.LineNumber] }, true);
                promises['Child'+childItem.ItemId+'addVoidItem'] = VoidItemsService.insert(childItem, true);
              });
            }
            return $q.all(promises).then(function(res){
              return DB.executeQueue().then(function () {
                return self.updateHeaderTotals(item.DocNo);
              })
            });
          });



        } else {
          return $q.reject('item is not valid');
        }
      }

      self.voidSalesKit = function (item) {
        if(item.ItemId && item.ItemType && item.LineNumber){
          var date = $filter('date')(new Date(), "yyyy-MM-dd HH:mm:ss");;

          return $q.all({
                    items: self.findSalesItems(item.LineNumber),
                    seqNo: DB.max(DB_CONFIG.tableNames.bill.voidItems, 'SeqNo', { columns: 'ItemId=?', data:[item.ItemId] })
          }).then(function (data) {
            DB.clearQueue();

            item.SysDateTime = date;
            renameProperty(item, 'ParentItemLineNumber', 'ParentItemId')
            item.ShiftId = ShiftService.getCurrentId();
            item.CashierId = AuthService.currentUser().Id;
            item.StaffId = 0;
            item.IsExported = false;
            item.SeqNo = ++data.seqNo;

            var queue = [
              DB.delete(DB_CONFIG.tableNames.bill.tempDetail, { columns: 'ItemId=? AND ItemType=? AND LineNumber=?', data:[item.ItemId, item.ItemType, item.LineNumber] }),
              DB.insert(DB_CONFIG.tableNames.bill.voidItems, _.pick(item, ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'IsExported', 'SysDateTime',
                'LineNumber', 'ItemType', 'ParentItemId', 'ShiftId', 'CashierId', 'StaffId', 'OrgPrice', 'AlteredPrice', 'Price', 'Qty', 'DiscAmount', 'SubTotal', 'SeqNo' ]))
            ];
            angular.forEach(data.items, function (salesKitItem) {
              var deferred = $q.defer();

                salesKitItem.SysDateTime = date;
                salesKitItem.ShiftId = ShiftService.getCurrentId();
                salesKitItem.CashierId = AuthService.currentUser().Id;
                salesKitItem.StaffId = 0;
                salesKitItem.IsExported = false;
                salesKitItem.SeqNo = ++data.seqNo;

                renameProperty(salesKitItem, 'ParentItemLineNumber', 'ParentItemId');
                $q.all([
                  DB.delete(DB_CONFIG.tableNames.bill.tempDetail, { columns: 'ItemId=? AND ItemType=? AND LineNumber=?', data:[salesKitItem.ItemId, salesKitItem.ItemType, salesKitItem.LineNumber] }),
                  DB.insert(DB_CONFIG.tableNames.bill.voidItems, _.pick(salesKitItem, ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'IsExported', 'SysDateTime',
                    'LineNumber', 'ItemType', 'ParentItemId', 'ShiftId', 'CashierId', 'StaffId', 'OrgPrice', 'AlteredPrice', 'Price', 'Qty', 'DiscAmount', 'SubTotal', 'SeqNo' ]))
                ]).then(function(){
                  deferred.resolve();
                }, function (ex) {
                  deferred.reject(ex);
                });
              queue.push(deferred.promise);

            });
            queue.push(self.updateHeaderTotals(item.DocNo));

            return $q.all(queue);
          });
        }else {
          return $q.reject('item is not valid');
        }
      }

      self.findItems = function (itemId, docNo, itemType, parentLineNumber) {
        if(itemType == 'NOR' || itemType == 'SKI'){
          var q = "SELECT *, (SELECT COUNT(*) FROM TempBillDetail AS ct WHERE ct.ParentItemLineNumber == mt.LineNumber) AS ChildCount FROM TempBillDetail AS mt WHERE SuspendDepDocNo IS NOT NULL AND SuspendDepDocNo = ''";
          var data = [];
          if(itemId){
            q += ' AND ItemId = ?';
            data.push(itemId);
          }
          if(docNo){
            q += ' AND DocNo = ?';
            data.push(docNo);
          }
          if(itemType){
            q += ' AND ItemType = ?';
            data.push(itemType);
          }
          if(parentLineNumber){
            q += ' AND ParentItemLineNumber = ?';
            data.push(parentLineNumber);
          }
          return DB.query(q, data
          // return DB.select(DB_CONFIG.tableNames.bill.tempDetail, "*", {
          //   columns: 'ItemId=? AND ItemType=? AND parentItemLineNumber = ?',
          //   data: [itemId, itemType, parentLineNumber||0]}
          ).then(function (res) {
            return DB.fetchAll(res);
          });
        } else {
          return $q.when([]);
        }
      }

      self.findSalesItems = function (parentItemLineNumber) {
        return DB.select(DB_CONFIG.tableNames.bill.tempDetail, "*", {
          columns: 'ParentItemLineNumber=?',
          data: [parentItemLineNumber]
        }).then(function (res) {
          return DB.fetchAll(res);
        });
      }

      self.getNewLineNumber = function () {
        return DB.max(DB_CONFIG.tableNames.bill.tempDetail, 'LineNumber').then(function (ln) {
          return ln + 100;
        });
      }

      self.changeItemQty = function (DocNo, ItemId, LineNumber, qty) {
        return DB.select(DB_CONFIG.tableNames.bill.tempDetail, '*', {columns: "ItemId=? AND LineNumber=? AND ParentItemLineNumber = 0 OR ParentItemLineNumber  = ? AND ItemType = 'MOD'", data: [ItemId, LineNumber, LineNumber]}).then(function (res) {
          var items = DB.fetchAll(res);
          var promises = [];
          angular.forEach(items, function(item){
            if(item && item.Qty != qty){
              item.Qty = qty;
              item = prepareItem(item);
              item = self.calculateTax(item);
              promises.push(DB.update(DB_CONFIG.tableNames.bill.tempDetail, item, {columns: 'ItemId=? AND LineNumber=?', data: [item.ItemId, item.LineNumber]}));
            } else {
              return $q.reject("Invalid item");
            }
          });
          promises.push(self.updateHeaderTotals(DocNo));
          return $q.all(promises);

        });
      }

      self.toggleRefundItem = function (ItemId, LineNumber, reasonId, reference) {
        return $q.all({
          item: DB.select(DB_CONFIG.tableNames.bill.tempDetail, '*', {columns: 'ItemId=? AND LineNumber=?', data: [ItemId, LineNumber]}),
          discounts: DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, '*', {columns: 'ItemId=? AND LineNumber=?', data: [ItemId, LineNumber]})
        }).then(function (res) {
          var i = DB.fetch(res.item);
          var discounts = DB.fetchAll(res.discounts);
          if(i){
            i.SubTotal *= -1;
            i.Qty *= -1;
            i.Tax1DiscAmount = _.isNumber(i.Tax1DiscAmount) ? (i.Tax1DiscAmount *= -1).roundTo(2) : 0;
            i.Tax2DiscAmount = _.isNumber(i.Tax2DiscAmount) ? (i.Tax2DiscAmount *= -1).roundTo(2) : 0;
            i.Tax3DiscAmount = _.isNumber(i.Tax3DiscAmount) ? (i.Tax3DiscAmount *= -1).roundTo(2): 0;
            i.Tax4DiscAmount = _.isNumber(i.Tax4DiscAmount) ? (i.Tax4DiscAmount *= -1).roundTo(2) : 0;
            i.Tax5DiscAmount = _.isNumber(i.Tax5DiscAmount) ? (i.Tax5DiscAmount *= -1).roundTo(2) : 0;
            i.Tax1Amount = _.isNumber(i.Tax1Amount) ? (i.Tax1Amount *= -1).roundTo(2) : 0;
            i.Tax2Amount = _.isNumber(i.Tax2Amount) ? (i.Tax2Amount *= -1).roundTo(2) : 0;
            i.Tax3Amount = _.isNumber(i.Tax3Amount) ? (i.Tax3Amount *= -1).roundTo(2) : 0;
            i.Tax4Amount = _.isNumber(i.Tax4Amount) ? (i.Tax4Amount *= -1).roundTo(2) : 0;
            i.Tax5Amount = _.isNumber(i.Tax5Amount) ? (i.Tax5Amount *= -1).roundTo(2) : 0;
            i.DiscAmount = _.isNumber(i.DiscAmount) ? (i.DiscAmount *= -1).roundTo(2) : 0;
            if(reasonId){
                i.ReasonId = reasonId;
            } else {
                i.ReasonId = 0;
            }
            if(reference){
                i.RefCode = reference;
            } else {
                i.RefCode = null;
            }

            discounts = _.map(discounts, function (discount) {
              discount.DiscountAmount *= -1;
              return DB.update(DB_CONFIG.tableNames.discounts.tempBillDiscounts, discount, {columns: 'ItemId=? AND LineNumber=?', data: [ItemId, LineNumber]});
            });
            var promises = [
              DB.update(DB_CONFIG.tableNames.bill.tempDetail, i, {columns: 'ItemId=? AND LineNumber=?', data: [ItemId, LineNumber]}),
              self.updateHeaderTotals(i.DocNo)
            ];
            promises.concat(discounts);
            return $q.all(promises);
          } else {
            return $q.reject("Invalid item");
          }
        });

      }

      self.setTakeAway = function (TakeAway, ItemId, LineNumber) {
        var query;
        var promises = [];
        var deferred = $q.defer();
        if(LineNumber && ItemId){
          query = DB.select(DB_CONFIG.tableNames.bill.tempDetail, '*', {columns: 'ItemId=? AND LineNumber=?', data: [ItemId, LineNumber]});
        } else {
          query = DB.select(DB_CONFIG.tableNames.bill.tempDetail, '*');
        }
        query.then(function (res) {
          var resultSet = DB.fetchAll(res);
          angular.forEach(resultSet, function(i){
            if(i){
              i.TakeAway = TakeAway;
              promises.push(DB.update(DB_CONFIG.tableNames.bill.tempDetail, i, {columns: 'ItemId=? AND LineNumber=?', data: [ItemId, LineNumber]}));

              $q.all(promises).then(function(){
                deferred.resolve();
              }, function(ex){
                deferred.reject(ex);
              });
            }
          });
        });
        return deferred.promise;
      }

      self.fullTakeAway = function(items, takeAway){
        var promises = [];
        angular.forEach(items, function(item){
          promises.push(self.setTakeAway(takeAway, item.ItemId, item.LineNumber));
        });
        return $q.all(promises);
      }

      self.getAllHeaders = function(){
        return DB.select(DB_CONFIG.tableNames.bill.header).then(function(res){ return DB.fetchAll(res); });
      }

      self.getAllDetails = function(){
        return DB.select(DB_CONFIG.tableNames.bill.detail).then(function(res){ return DB.fetchAll(res); });
      }

      self.getAllTransactions = function(){
        return DB.select(DB_CONFIG.tableNames.bill.payTransactions).then(function(res){ return DB.fetchAll(res); });
      }

      self.getAllTransactionsOT = function(){
        return DB.select(DB_CONFIG.tableNames.bill.payTransactionsOverTender).then(function(res){ return DB.fetchAll(res); });
      }

      self.getBillHeader = function(DocNo){
        return DB.select(DB_CONFIG.tableNames.bill.header, '*', { columns: 'DocNo=?', data: [DocNo] }).then(function(res){ return DB.fetch(res); });
      }

      self.getBillDetails = function(DocNo){
        return DB.select(DB_CONFIG.tableNames.bill.detail, '*', { columns: 'DocNo=?', data: [DocNo] }).then(function(res){ return DB.fetchAll(res); });
      }

      self.updateHeaderTotals = function(DocNo, items){
        var promises = {
          header: self.getTempHeader(DocNo)
        };
        if(!items){
          promises.items = self.getItems(DocNo);
        }
        return $q.all(promises).then(function(data){
          if(data.header && data.items){
            data.header.SubTotal = 0;
            data.header.DiscAmount = 0;
            data.header.Tax1Amount = 0;
            data.header.Tax2Amount = 0;
            data.header.Tax3Amount = 0;
            data.header.Tax4Amount = 0;
            data.header.Tax5Amount = 0;
            data.header.Tax1DiscAmount = 0;
            data.header.Tax2DiscAmount = 0;
            data.header.Tax3DiscAmount = 0;
            data.header.Tax4DiscAmount = 0;
            data.header.Tax5DiscAmount = 0;
            angular.forEach(data.items, function(item){
              data.header.SubTotal += item.SubTotal;
              data.header.DiscAmount += item.DiscAmount;
              data.header.Tax1Amount += item.Tax1Amount;
              data.header.Tax2Amount += item.Tax2Amount;
              data.header.Tax3Amount += item.Tax3Amount;
              data.header.Tax4Amount += item.Tax4Amount;
              data.header.Tax5Amount += item.Tax5Amount;
              data.header.Tax1DiscAmount += item.Tax1DiscAmount;
              data.header.Tax2DiscAmount += item.Tax2DiscAmount;
              data.header.Tax3DiscAmount += item.Tax3DiscAmount;
              data.header.Tax4DiscAmount += item.Tax4DiscAmount;
              data.header.Tax5DiscAmount += item.Tax5DiscAmount;
            });
            return updateTempHeader(data.header);
          } else {
            return $q.reject("No valid bill for this DocNo");
          }
      });
    };



      self.setOrderTag = function(DocNo, tag){
        return TempBillHeaderService.update(DocNo, { OrderTag: tag });
      }


      return self;
    }
  ]);
