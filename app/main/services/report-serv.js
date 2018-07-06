
angular.module('itouch.services')
.service('Report', ['PrinterSettings', 'PrintService', 'DB', 'DB_CONFIG', '$q', 'ItemService', 'AuthService', 'ShiftService', 'ControlService', 'LocationService', 'SettingsService', 'Alert', 'TransactService',
  function (PrinterSettings, PrintService, DB, DB_CONFIG, $q, ItemService, AuthService, ShiftService, ControlService, LocationService, SettingsService, Alert, TransactService) {
    var self = this;
    var Pdata = null;
    var printer = PrintService.getPrinter();
    var location = LocationService.currentLocation;
    var data = PrinterSettings.fetchData();
    var bDate = null;
    var shift = null;
    var machine = null;
    var now = null;
    var user = null;

    var setParameters = function () {
      printer = PrintService.getPrinter();
      location = LocationService.currentLocation;
      bDate = ControlService.getBusinessDate();
      shift = ShiftService.getCurrent();
      user = AuthService.currentUser();
      now = moment().format('DD/MM/YYYY hh:mm:ss A');
      machine = SettingsService.getCurrentMachine();
    };

    self.getAll = function () {
      PrinterSettings.get().then(function (res) {
        data = res;
        return data;
        // return data = res;
      });
    };
    self.getAll();

    self.creatRecieptHeader = function () {
      printer = PrintService.getPrinter();
      printer.addTextAlign(printer.ALIGN_CENTER);
      PrintService.addImage();
      PrintService.addLineBreak();
      self.getAll();
      if (data != null) {
        angular.forEach(data.Header, function (row) {
          if (row.IsBold == 'false') {
            printer.addTextStyle(false, false, false);
            printer.addTextSize(1, 1);
          } else {
            printer.addTextStyle(false, false, true);
            printer.addTextSize(2, 1);
          }
          printer.addText(row.Text + '\n');
        });
      }
      data = null;
    };

    self.creatRecieptBody = function (data) {


      printer.addTextAlign(printer.ALIGN_LEFT);
      PrintService.addHLine();

      angular.forEach(data.items, function (row) {
        PrintService.addLine(row.Desc1, '$' + (row.SubTotal.toFixed(2)), '' + row.Qty);
        if (row.discounts) {
          angular.forEach(row.discounts, function (discount) {
            PrintService.addTabbedLine(discount.Description1, '-$' + (discount.DiscountAmount ? discount.DiscountAmount.toFixed(2) : 0));
          });
        }
      });

      PrintService.addHLine();

      PrintService.addLine('SUBTOTAL', '$' + (data.header.Total.toFixed(2)));
      PrintService.addLine('TOTAL', '$' + (data.header.Total.toFixed(2)));
      var change = null;
      angular.forEach(data.transactions, function (row) {
      // console.log(row);
        PrintService.addLine(row.Description1 || 'ROUNDED', '$' + (row.Amount.toFixed(2)));
        if (row.Cash == 'true' && row.ChangeAmount > 0) {
          change = row.ChangeAmount.toFixed(2);
        }
      });
      if (change) {
        printer.addText('\nChange Due: $' + change + '\n');
      }
      printer.addText('\n');
    };

    self.creatRecieptFooter = function (sh) {
      setParameters();
      if (sh) {
        shift = sh;
      }
      printer.addTextAlign(printer.ALIGN_CENTER);
      printer.addText('\nBDate: ' + bDate.format('DD/MM/YYYY') + ', Shift: ' + shift.Description1 + ', M/C: ' + machine.Code + '\n');
    //printer.addText(now+' User: '+ user.Id +'\n');
      printer.addText(now + ', User: ' + user.Code + '\n');
    };

    self.print = function (DocNo) {
      if (PrintService.isConnected()) {
        try {
          printer = PrintService.getPrinter();
          creatBodyData(DocNo);
        } catch (e) {
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    };

    self.printAddFloat = function (floatAmount) {
      if (PrintService.isConnected()) {
        try {
          setParameters();
          printer = PrintService.getPrinter();
          self.creatRecieptHeader();
          PrintService.addHLine();
          printer.addTextSize(2, 1);
          PrintService.addTitle('Add Float\n');
          printer.addTextSize(1, 1);
          // console.log(floatAmount);
          var FIA = parseFloat(floatAmount);
          if (typeof(FIA) != 'number') { FIA = 0;}
          PrintService.addLine('Amount :', (FIA.toFixed(2)));
          // PrintService.addLine('Amount :', floatAmount + '.00');

          self.creatRecieptFooter();

          printer.addCut(printer.CUT_FEED);

          printer.send();
        } catch (e) {
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    };

    self.printDeclareCash = function (shift, amount) {
      if (PrintService.isConnected()) {
        try {
          printer = PrintService.getPrinter();
          self.creatRecieptHeader();
          PrintService.addHLine();
          printer.addTextSize(2, 1);
          PrintService.addTitle('Declare Cash\n');
          printer.addTextSize(1, 1);
          PrintService.addLine('Cash in Drawer :', (amount.toFixed(2)) + '\n');

          self.creatRecieptFooter(shift);

          printer.addCut(printer.CUT_FEED);

          printer.send();
        } catch (e) {
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    };


    self.getBillHeader = function (DocNo) {
      return DB.query('SELECT *  FROM ' + DB_CONFIG.tableNames.bill.header + ' WHERE DocNo = ?', [DocNo]).then(function (res) {
        var item = DB.fetch(res);
        item = ItemService.calculateTotal(item);
      // item.SubTotal = item.SubTotal + item.Tax;
        return item;
      });
    };

    self.getBillItems = function (DocNo) {
      var q = 'SELECT de.*, bd.DiscountAmount, d.Description1, d.Description2 ' +
    'FROM BillDetail AS de ' +
    'LEFT OUTER JOIN BillDiscounts AS bd ON bd.ItemId = de.ItemId AND bd.LineNumber = de.LineNumber AND de.DocNo = bd.DocNo ' +
    'LEFT OUTER  JOIN Discounts AS d ON d.Id = bd.DiscountId';
      return DB.query(q + ' WHERE de.DocNo = ?', [DocNo]).then(function (res) {
        var items = {};
        angular.forEach(DB.fetchAll(res), function (item) {
          if (item) {
            var exItem = items['' + item.LineNumber + item.ItemId];
            if (!exItem) {
              item = ItemService.calculateTotal(item);
              item.SubTotal = item.SubTotal + item.Tax;
              item.discounts = [];
              if (item.DiscountAmount) {
                item.discounts.push(_.pick(item, [ 'DiscountAmount', 'Description1', 'Description2' ]));
                item = _.omit(item, [ 'DiscountAmount', 'Description1', 'Description2' ]);
              }
              items['' + item.LineNumber + item.ItemId] = item;
            } else {
              if (item.DiscountAmount) {
                exItem.discounts.push(_.pick(item, ['DiscountAmount', 'Description1', 'Description2']));
              }
            }
          }

        });

        console.log(items);

        return items;
      });
    };

    self.getBillTransactions = function (DocNo) {
      return DB.query('SELECT pt.Amount, pt.ChangeAmount, pt.Cash, tt.Description1  FROM ' + DB_CONFIG.tableNames.bill.payTransactions + ' AS pt LEFT OUTER JOIN ' + DB_CONFIG.tableNames.bill.tenderTypes + ' AS tt ON pt.PayTypeId = tt.Id WHERE DocNo = ?', [DocNo]).then(function (res) {
      // return _.map(DB.fetchAll(res), function (item) {
      //   return ItemService.calculateTotal(item);
      // });
        return DB.fetchAll(res);
      });
    };

    self.getBillTransactionOT = function (DocNo) {
      return DB.query('SELECT pt.Amount, pt.ChangeAmount, pt.Cash, pt.OverTenderType  FROM ' + DB_CONFIG.tableNames.bill.payTransactions + ' AS pt WHERE DocNo = ?', [DocNo]).then(function (res) {
        return DB.fetch(res);
      });
    };

    self.getBillDiscounts = function (DocNo) {
      return DB.query('SELECT *  FROM ' + DB_CONFIG.tableNames.discounts.billDiscounts + ' WHERE DocNo = ?', [DocNo]).then(function (res) {
      // return _.map(DB.fetchAll(res), function (item) {
      //   return ItemService.calculateTotal(item);
      // });
        return DB.fetchAll(res);
      });
    };

    var creatBodyData = function (DocNo) {
      $q.all({
        header: self.getBillHeader(DocNo),
        items: self.getBillItems(DocNo),
        transactions: self.getBillTransactions(DocNo),
        transactionOT: self.getBillTransactionOT(DocNo)
      }).then(function (data) {
        self.creatRecieptHeader();
        self.creatRecieptBody(data);

        self.creatRecieptFooter(data.header.DocNo, data.header.Tax);

        printer.addCut(printer.CUT_FEED);

        printer.send();
      });
    };

    self.printShiftClosingReport = function (shiftId, businessDate) {
      setParameters();
      if (businessDate) {
        bDate = businessDate;
      }
      $q.all({
        shift: ShiftService.getById(shiftId),
        header: TransactService.getHeaderDetails(shiftId, bDate.format('YYYY-MM-DD')),
        trans: TransactService.getTransDetails(shiftId, bDate.format('YYYY-MM-DD')),
        transactionAmounts: TransactService.getTransactionAmounts(bDate.format('YYYY-MM-DD'), shiftId),
        transactionBreakdown: TransactService.getTransactionBreakdown(bDate.format('YYYY-MM-DD'), shiftId),
        voidtransactionBreakdown: TransactService.getVoidTransactionBreakdown(bDate.format('YYYY-MM-DD'), shiftId),
        gst: TransactService.getGst(bDate.format('YYYY-MM-DD'), shiftId),
        overTenderBreakdown: TransactService.getOverTenderBreakdown(bDate.format('YYYY-MM-DD'), shiftId),
        voidoverTenderBreakdown: TransactService.getVoidOverTenderBreakdown(bDate.format('YYYY-MM-DD'), shiftId),
        recCount: TransactService.getReceiptCount(bDate.format('YYYY-MM-DD'), shiftId),
      }).then(function (data) {
      // console.log(data);
        if (data.header.void) {
        // data.header.sales.Total -= data.header.void.Total;
        // data.header.sales.Discount -= data.header.void.Discount;
        }
        var localTotal = (data.trans.cash ? data.trans.cash.Amount : 0 );
        localTotal += data.trans.nonCash ? data.trans.nonCash.Amount : 0;
      //localTotal -= data.trans.cash ? data.trans.cash.ChangeAmount : 0
        var miscTotal = data.header.float ? data.header.float.Total : 0;
        miscTotal += data.header.payOut ? data.header.payOut.Total : 0;
        miscTotal += data.header.receiveIn ? data.header.receiveIn.Total : 0;
        miscTotal += data.trans.rounded ? data.trans.rounded.Amount : 0;
      //var cash = (data.trans.cash?data.trans.cash.Amount-data.trans.cash.ChangeAmount:0);
        var cash = (data.trans.cash ? data.trans.cash.Amount : 0);
        var diff = (data.header.cashDeclared ? data.header.cashDeclared.Total : 0) - cash;

        _.forEach(data.overTenderBreakdown, function (row) {
          localTotal -= row.Amount;
        });

        if (PrintService.isConnected()) {
          try {
            printer = PrintService.getPrinter();
            self.creatRecieptHeader();
            PrintService.addHLine();
            PrintService.addTitle(data.shift ? 'Shift Closing Report' : 'Z Report');
            PrintService.alignCenter();
            if (data.shift) {
              PrintService.addTextLine('Shift : ' + data.shift.Description1);
            }

            PrintService.addLineBreak();
            PrintService.addTextLine('BUSINESS DATE : ' + bDate.format('DD/MM/YYYY'));
          //PrintService.addTextLine('TAKEN BY : '+ user.Id);
            PrintService.addTextLine('TAKEN BY : ' + user.Code);

            PrintService.addLineBreak();


            PrintService.alignLeft();
            PrintService.addTextLine('CASH IN DRAWER (INCLUDING FLOAT)');
            PrintService.addReportLine('DECLARED', (data.header.cashDeclared ? data.header.cashDeclared.Total : 0).toFixed(2));
            PrintService.addReportLine('ACTUAL', cash.toFixed(2));
            PrintService.addTabbedLine('DIFFERENCE', diff.toFixed(2));
            PrintService.addLineBreak();
            PrintService.addLineBreak();

            PrintService.addTextLine('SALES TRANSACTIONS');
          /*PrintService.addReportLine('GROSS SALES', (data.header.sales ? (data.header.sales.SubTotal + data.header.sales.Tax5Amount): 0).toFixed(2), ""+(data.header.sales?data.header.sales.ItemCount: 0));
          PrintService.addReportLine('DISCOUNT', (data.header.discounted? (data.header.discounted.DiscAmount+data.header.discounted.Tax5DiscAmount): 0).toFixed(2), ""+(data.header.discounted?data.header.discounted.ItemCount: 0));*/
            PrintService.addReportLine('GROSS SALES', (data.header.sales ? (data.header.sales.SubTotal + data.header.sales.Tax5Amount) : 0).toFixed(2), '' + (data.header.sales.ItemCount - (data.header.void.ItemCount * 2)));
            PrintService.addReportLine('DISCOUNT', (data.header.discounted ? (data.header.discounted.DiscAmount + data.header.discounted.Tax5DiscAmount) : 0).toFixed(2), '' + (data.header.discounted.ItemCount - (data.header.voiddiscounted.ItemCount * 2)));
            PrintService.addTabbedLine('SALES TOTAL', (data.header.sales ? data.header.sales.Total : 0).toFixed(2));
            PrintService.addLineBreak();
            PrintService.addLineBreak();

            PrintService.addTextLine('MISCELLANEOUS TRANSACTIONS');
          //PrintService.addReportLine('ROUNDED', (data.trans.rounded? data.trans.rounded.Amount||0:0).toFixed(2), ""+(data.trans.rounded?data.trans.rounded.ItemCount: 0));
            var roundedCount = (data.trans.rounded.ItemCount || 0);
            var voidroundedCount = (data.trans.voidrounded[0].ItemCount || 0);
            PrintService.addReportLine('ROUNDED', (data.trans.rounded ? data.trans.rounded.Amount || 0 : 0).toFixed(2), '' + (roundedCount - (voidroundedCount * 2)));
            PrintService.addReportLine('R.A(FLOAT)', (data.header.float ? data.header.float.Total : 0).toFixed(2), '' + (data.header.float ? data.header.float.ItemCount : 0));
            PrintService.addReportLine('PAY OUT', (data.header.payOut ? data.header.payOut.Total : 0).toFixed(2), '' + (data.header.payOut ? data.header.payOut.ItemCount : 0));
            PrintService.addReportLine('RECEIVE IN', (data.header.receiveIn ? data.header.receiveIn.Total : 0).toFixed(2), '' + (data.header.receiveIn ? data.header.receiveIn.ItemCount : 0));
            PrintService.addTabbedLine('MISC TOTAL', miscTotal.toFixed(2));
            PrintService.addReportLine('TRANSACTION TOTAL', ((data.header.sales ? data.header.sales.Total : 0) + miscTotal).toFixed(2));
            PrintService.addLineBreak();
            PrintService.addLineBreak();

            PrintService.addTextLine('LOCAL COLLECTION');
            PrintService.addTextLine('  CASH COLLECTION (INCLUDING FLOAT)');
          //PrintService.addReportLine('CASH', cash.toFixed(2), ""+(data.trans.cash?data.trans.cash.ItemCount: 0));
            PrintService.addReportLine('CASH', cash.toFixed(2), '' + (data.trans.cash.ItemCount - (data.header.void.ItemCount * 2)));
            if (data.transactionBreakdown && data.transactionBreakdown.cash) {
              _.forEach(data.transactionBreakdown.cash, function (row) {
              //PrintService.addTextLine("  *"+row.Description1 + "      " + ""+(row.Count||0) + "      " + ((row.Amount - row.ChangeAmount)||0).toFixed(2)+"*");
              //PrintService.addTextLine("  *"+row.Description1 + "      " + ""+(row.Count-voidCashCount) + "      " + ((row.Amount - row.ChangeAmount)||0).toFixed(2)+"*");

              //PrintService.addTextLine("  *"+row.Description1 + "      " + ""+(rowCount-voidCashCount) + "      " + ((row.Amount - row.ChangeAmount)||0).toFixed(2)+"*");
                var voidCashCount = (data.voidtransactionBreakdown[row.Id] || 0);
                var rowCount = (row.Count || 0);
              //PrintService.addTextLine("  *"+row.Description1 + "      " + ""+(rowCount-((voidCashCount?voidCashCount:0)*2)) + "      " + ((row.Amount - row.ChangeAmount)||0).toFixed(2)+"*");
                PrintService.addTextLine('  *' + row.Description1 + '      ' + '' + (rowCount - ((voidCashCount ? voidCashCount : 0) * 2)) + '      ' + ((row.Amount) || 0).toFixed(2) + '*');
              });
            }
            if (data.transactionBreakdown && data.transactionBreakdown.nonCash) {
              PrintService.addTextLine('NON-CASH COLLECTION');
              _.forEach(data.transactionBreakdown.nonCash, function (row) {
              /*PrintService.addReportLine(row.Description1, ((row.Amount - row.ChangeAmount)||0).toFixed(2), ""+(row.Count||0));*/
              // localTotal += row.Amount;
              //var voidRowCount=data.voidtransactionBreakdown[row.Id]?data.voidtransactionBreakdown[row.Id]:0;
                var voidRowCount = (data.voidtransactionBreakdown[row.Id] || 0);
                var rowCount = (row.Count || 0);
                PrintService.addReportLine(row.Description1, ((row.Amount - row.ChangeAmount) || 0).toFixed(2), '' + (rowCount - (voidRowCount * 2)));
              //PrintService.addReportLine(row.Description1, ((row.Amount - row.ChangeAmount)||0).toFixed(2), ""+(row.Count-voidRowCount));
              });
            }

            if (data.overTenderBreakdown) {
              PrintService.addTextLine('  OVER TENDER COLLECTION');
              _.forEach(data.overTenderBreakdown, function (row) {
                var desc = '';
                switch (row.OverTenderTypeId) {
                  case 2:
                    desc = 'Credit Note';
                    break;
                  default:
                    desc = 'Forfeited';
                }
                var  vdOvertransCount = (data.voidoverTenderBreakdown[row.OverTenderTypeId] || 0);
                var rowCount = (row.Count || 0);
                PrintService.addReportLine(' ' + desc, (row.Amount || 0).toFixed(2), '' + (rowCount - (vdOvertransCount * 2)));

              //PrintService.addReportLine(" "+desc, (row.Amount||0).toFixed(2), ""+(row.Count||0));
              //PrintService.addReportLine(" "+desc, (row.Amount||0).toFixed(2), ""+(row.Count -vdOvertransCount));
              });
            }
            PrintService.addTabbedLine('LOCAL TOTAL', localTotal.toFixed(2));
            PrintService.addLineBreak();
            PrintService.addLineBreak();

            PrintService.addTextLine(location.Tax5Desc1);
          //PrintService.addReportLine('TAX TOTAL', (data.gst.Tax5Amount-data.gst.Tax5DiscAmount).roundTo(2).toFixed(2), ""+ (data.gst ? data.gst.ItemCount : 0));
            PrintService.addReportLine('TAX TOTAL', (data.gst.Tax5Amount - data.gst.Tax5DiscAmount).roundTo(2).toFixed(2), '' + (data.gst.ItemCount - ((data.header.void.ItemCount ? data.header.void.ItemCount : 0) * 2)));
            PrintService.addLineBreak();
            PrintService.addLineBreak();

            PrintService.addReportLine('ITEM REVERSE', (data.header.reverse ? (data.header.reverse.Total * -1) : 0).toFixed(2), '' + (data.header.reverse ? data.header.reverse.ItemCount : 0));
            PrintService.addReportLine('ABORT', (data.header.abort ? data.header.abort.Total : 0).toFixed(2), '' + (data.header.abort ? data.header.abort.ItemCount : 0));
          //PrintService.addReportLine('TRANS VD', (data.header.void? (data.header.void.Total*-1):0).toFixed(2), ""+ (data.header.void ? data.header.void.ItemCount : 0));
            PrintService.addReportLine('TRANS VD', (data.header.void ? (data.header.void.Total) : 0).toFixed(2), '' + (data.header.void ? data.header.void.ItemCount : 0));
            PrintService.addReportLine('ITEM VD', (data.header.itemVoid ? data.header.itemVoid.Total : 0).toFixed(2), '' + (data.header.itemVoid ? data.header.itemVoid.ItemCount : 0));
            PrintService.addLineBreak();
          // PrintService.addReportLine('DRAWER OPEN', (data.header.float? data.header.float.Total:0).toFixed(2));
            PrintService.addReportLine('RECEIPT COUNT', data.recCount.toFixed(2));
            PrintService.addLineBreak();
            PrintService.addLineBreak();

            PrintService.alignCenter();
            PrintService.addTextLine(now + ' ' + ' Machine : ' + machine.Code);
            PrintService.addTextLine('**');


            printer.addCut(printer.CUT_FEED);

            printer.send();
          } catch (e) {
            console.log(e);
          }
        } else {
          Alert.success('printer not connected', 'Error');
        }

      }, function (ex) {
        console.log(ex);
      });
    };
    // self.printShiftClosingReport(0);

  }]);
