'use strict';
angular.module('itouch.services')
.service('Reciept', ['$log', 'PrinterSettings', 'PrintService', 'DB', 'DB_CONFIG', '$q', 'ItemService', 'AuthService', 'ShiftService', 'ControlService', 'LocationService', 'SettingsService', 'Alert', 'Restangular', 'DiscountService', 'BillService',
  function ($log, PrinterSettings, PrintService, DB, DB_CONFIG, $q, ItemService, AuthService, ShiftService, ControlService, LocationService, SettingsService, Alert, Restangular, DiscountService, BillService) {
    var self = this;
    var printData = null;
    var printer = PrintService.getPrinter();
    var location = LocationService.currentLocation;
  // console.log(location);

    self.formatDate = function (dateVal) {
      var newDate = new Date(dateVal);

      // var sMonth = self.padValue(newDate.getMonth() + 1);
      // var sDay = self.padValue(newDate.getDate());
      // var sYear = newDate.getFullYear();
      var sHour = newDate.getHours();
      // var sMinute = self.padValue(newDate.getMinutes());
      // var sSecond = self.padValue(newDate.getSeconds());
      var sAMPM = 'AM';

      var iHourCheck = parseInt(sHour);

      if (iHourCheck > 12) {
        sAMPM = 'PM';
        sHour = iHourCheck - 12;
      }
      else if (iHourCheck === 0) {
        sHour = '12';
      }

      sHour = self.padValue(sHour);

    //return sDay + "-" + sMonth + "-" + sYear + " " + sHour + ":" + sMinute +":"+sSecond+ " " + sAMPM;
      return sAMPM;
    };
    self.padValue = function (value) {
      return (value < 10) ? '0' + value : value;
    };

    self.getAll = function () {
      PrinterSettings.get().then(function (res) {
        printData = res;
      });
    };
    self.getAll();

    self.creatRecieptHeader = function () {

      printer.addTextAlign(printer.ALIGN_CENTER);
      PrintService.addImage();
      PrintService.addLineBreak();
      angular.forEach(printData.Header, function (row) {
        // console.log('rows');
        // console.log(row);
        if (row.IsBold == 'false') {
          printer.addTextStyle(false, false, false);
          printer.addTextSize(1, 1);
        } else {
          printer.addTextStyle(false, false, true);
          printer.addTextSize(2, 1);
        }
        printer.addText(row.Text + '\n');
      });
    };

    self.creatRecieptBody = function (data, withSubTotalSection) {
      var subTotal = 0;
      printer.addTextStyle(false, false, false);
      printer.addTextSize(1, 1);
      printer.addTextAlign(printer.ALIGN_LEFT);
      PrintService.addHLine();

      if (data.header.ReprintCount)
    {
        if (data.header.DocType == 'SA') {
          var sysDT = data.header.SysDateTime.split(' ');
          if (sysDT.length == 1)
       {
            sysDT = data.header.SysDateTime.split('T');
          }
          printer.addText('[RE-PRINTED  ' + data.header.ReprintCount + ' x]\n');
          printer.addText('[Transacted at ' + sysDT[1] + sysDT[2] + ']\n\n');
        }
      }
      if (data.header.OrderTag) {
        printer.addText('  Order Tag    : ' + data.header.OrderTag + '\n');
      }

      if (data.header.HeaderTitle)
      {
        PrintService.addTitle(data.header.HeaderTitle + '\n');
      }

      angular.forEach(data.items, function (row) {
        var sTotal = (row.SubTotal + row.Tax5Amount).roundTo(2);
        var text = row.Desc1;
        if (row.ParentItemLineNumber > 0) {
          text = '  ' + text;
        }
      //if (row.ItemType == 'MOD'){
        if (row.NoDiscount == 'true') {
          text += ' **';
        } else if (row.TakeAway == 'true') {
          text += ' *';
        }

        if (row.ItemType != 'RND') {
          PrintService.addLine(text, ' ' + (sTotal.toFixed(2)), '' + row.Qty);
        }
        subTotal += sTotal;
        if (row.discounts) {
          angular.forEach(row.discounts, function (discount) {
            if (discount.Description1) {
              if (!discount.DiscountAmount) {
                discount.DiscountAmount = 0;
              }
              PrintService.addTabbedLine(discount.Description1, ' ' + (discount.DiscountAmount * -1).toFixed(2));
              subTotal -= discount.DiscountAmount ? discount.DiscountAmount : 0;
            }

          });
        }

        if (row.ReasonId) {
          printer.addText('\tReason    : ' + row.ReasonDesc1 + '\n');
          printer.addText('\tReference : ' + (row.RefCode ? row.RefCode : '') + '\n');
        }
      });

      PrintService.addHLine();


      if (withSubTotalSection) {
        // console.log(data.tenderDiscounts);
        PrintService.addLine('SUBTOTAL', '$' + subTotal.toFixed(2));
        if (data.tenderDiscounts && data.tenderDiscounts.length > 0) {
          var tenderDisAmount = 0;
          angular.forEach(data.tenderDiscounts, function (row) {
            PrintService.addLine(row.Description1, ' ' + (row.Amount * -1).toFixed(2));
                //PrintService.addLine(row.Description1, (row.Amount > 0 ? "-" : "+") + row.Amount.toFixed(2));
            tenderDisAmount += row.Amount;
          });

          PrintService.addLine('SUBTOTAL After Discount', '$' + (subTotal - tenderDisAmount).toFixed(2));
        }
        PrintService.addLine('TOTAL', '$' + (data.header.Total.toFixed(2)));
        var change = null, forfeited = null;
        angular.forEach(data.transactions, function (row) {
            // console.log(row);
          PrintService.addLine(row.Description1 || 'ROUNDED', '$' + ((row.Amount + row.ChangeAmount).toFixed(2)));
          if (row.ChangeAmount > 0) {
            if (row.Cash == 'true') {
              change = row.ChangeAmount.toFixed(2);
            } else {
              forfeited = row.ChangeAmount.toFixed(2);
            }

          }
        });
        if (data.transactionOT) {
          if (data.transactionOT.OverTenderTypeId == 3) {
                //printer.addText('\nChange Due: $' + (data.transactionOT.Amount||0).toFixed(2) + "\n");
            printer.addText('\nChange Due: $' + (data.transactionOT.ChangeAmount || 0).toFixed(2) + '\n');
          } else {
            printer.addText('\nForfeited : $' + (data.transactionOT.Amount || 0).toFixed(2) + '\n');
          }
        }
      }
      printer.addText('\n');

      if (withSubTotalSection && location.Tax5Option == 3) { //Tax inclusive
        printer.addText('Inc of ' + location.Tax5Desc1 + ' $' + data.header.Tax.toFixed(2) + '\n\n');
      }

    };

    self.creatRecieptFooter = function (header, footerData) {
      printer.addTextSize(1, 1);
      printer.addTextAlign(printer.ALIGN_CENTER);
      var bDate = ControlService.getBusinessDate();
      var shift = ShiftService.getCurrent();
      var bd = new Date(header.BusinessDate);
      var businessDate = self.padValue(bd.getDate()) + '-' + self.padValue((bd.getMonth() + 1)) + '-' + bd.getFullYear();

      var curtSysDateTime = moment().format('DD-MM-YYYY hh:mm:ss a');
      var machine = SettingsService.getCurrentMachine();

      angular.forEach(printData.Footer, function (row) {
        if (row.IsBold == 'false') {
          printer.addTextStyle(false, false, false);
        } else {
          printer.addTextStyle(false, false, true);
        }

        printer.addText(row.Text + '\n');
        printer.addTextStyle(false, false, false);
      });
      printer.addText('\nBDate: ' + businessDate + ', Shift: ' + (footerData.shift ? footerData.shift.Description1 : '' ) + ', M/C: ' + (footerData.machine ? footerData.machine.Code : '') + '\n');
      if (footerData.cashier) {
        printer.addText(curtSysDateTime + ', User: ' + footerData.cashier.Code + ' ' + header.DocNo + '\n');
      }
      else {
        AuthService.getUserById(header.CashierId).then(function (data) {
          printer.addText(curtSysDateTime + ', User: ' + data.Code + ' ' + header.DocNo + '\n');
        });
      }
    //printer.addText('\nBDate: '+header.BusinessDate+' Shift: '+ (footerData.shift ? footerData.shift.Description1: '' ) +' M/C: '+ (footerData.machine ? footerData.machine.Code : '') +'\n');
    //printer.addText(header.SysDateTime+sampm+' User: '+ footerData.cashier.Code + ' ' + header.DocNo +'\n');
    };

    self.print = function (DocNo) {
      BillService.getBillHeader(DocNo).then(function (result) {
        var header = result;
        header.ReprintCount += 1;
        DB.update(DB_CONFIG.tableNames.bill.header, header, {columns: 'DocNo=?', data: [DocNo]});
      });

      if (PrintService.isConnected()) {
        try {
          printer = PrintService.getPrinter();

          if (printer) {
            self.fetchData(DocNo).then(function (data) {

              printData = data.printData;

              if (data && data.header && data.footerData) {
                if (data.header.DocType == 'VD') {
                  data.header.HeaderTitle = 'Transaction Void' + '\n' + data.header.SalesDocNo;
                }
                else if (data.header.DocType == 'AV')
                  {data.header.HeaderTitle = 'Abort';}

                self.creatRecieptHeader();

                self.creatRecieptBody(data, true);


                self.creatRecieptFooter(data.header, data.footerData);

                printer.addCut(printer.CUT_FEED);

                printer.send();
              } else {
                console.log('bill not available');
              }
            });
          }

        } catch (e) {
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    };

    self.printVoid = function (DocNo) {
      if (PrintService.isConnected()) {
        try {
          printer = PrintService.getPrinter();

          self.fetchData(DocNo).then(function (data) {
            printData = data.printData;
            if (data && data.header) {
              data.header.HeaderTitle = 'Transaction Void' + '\n' + data.header.SalesDocNo;

              self.creatRecieptHeader();

              self.creatRecieptBody(data, data.header.Tax, true);

              self.creatRecieptFooter(data.header, data.footerData);

              printer.addCut(printer.CUT_FEED);

              printer.send();
            } else {
              console.log('bill not available');
            }
          });

        } catch (e) {
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    };

    self.printAbort = function (DocNo) {
      if (PrintService.isConnected()) {
        try {
          printer = PrintService.getPrinter();

          self.fetchData(DocNo).then(function (data) {
            console.log(data.footerData.cashier.Code);
            printData = data.printData;
            if (data && data.header) {
              data.header.HeaderTitle = 'Abort';
              self.creatRecieptHeader();

              self.creatRecieptBody(data, false);

              self.creatRecieptFooter(data.header, data.footerData);

              printer.addCut(printer.CUT_FEED);

              printer.send();
            } else {
              console.log('bill not available');
            }
          });

        } catch (e) {
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    };

    self.printSignal = function () {
      if (PrintService.isConnected()) {
        try {
          printer = PrintService.getPrinter();
          printer.send();
        } catch (e) {
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    };

    self.getBillHeader = function (DocNo) {
      return DB.query('SELECT v.*, s.DocNo  AS SalesDocNo  FROM ' + DB_CONFIG.tableNames.bill.header + ' AS v LEFT OUTER JOIN ' + DB_CONFIG.tableNames.bill.header + ' AS s ON v.DocNo = s.VoidDocNo WHERE v.DocNo = ?', [DocNo]).then(function (res) {
        var item = DB.fetch(res);
        item = ItemService.calculateTotal(item);
      //item.SubTotal = item.SubTotal + item.Tax;
      //console.log(item);
        return item;
      });
    };

    self.getBillItems = function (DocNo) {
      var q = 'SELECT de.*, bd.DiscountAmount, d.Description1, d.Description2, r.Description1 AS ReasonDesc1, r.Description2 AS ReasonDesc2 ' +
    'FROM BillDetail AS de ' +
    'LEFT OUTER JOIN BillDiscounts AS bd ON bd.ItemId = de.ItemId AND bd.LineNumber = de.LineNumber AND de.DocNo = bd.DocNo ' +
    'LEFT OUTER  JOIN Discounts AS d ON d.Id = bd.DiscountId AND bd.DiscountFrom = \'I\' ' +
    'LEFT OUTER  JOIN Reason AS r ON r.Code = de.ReasonId ';
      return DB.query(q + 'WHERE de.DocNo = ? AND de.ItemType != \'RND\' ORDER BY de.LineNumber AND bd.SeqNo', [DocNo]).then(function (res) {
        var items = {};
        angular.forEach(DB.fetchAll(res), function (item) {
          if (item) {
            var exItem = items['' + item.LineNumber + item.ItemId];
            if (!exItem) {
              item = ItemService.calculateTotal(item);
            // item.SubTotal = item.SubTotal + item.Tax;
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

        items = _.sortBy(_.values(items), 'LineNumber');
        return items;
      });
    };

    self.getTenderDiscounts = function (DocNo) {
      var q = 'SELECT SUM(bd.DiscountAmount) AS Amount, d.Description1 AS Description1 FROM BillDiscounts AS bd INNER JOIN Discounts AS d ON d.Id = bd.DiscountId INNER JOIN BillHeader AS bh ON bd.DocNo = bh.DocNo WHERE DiscountFrom = \'T\' AND bh.DocNo = ?  GROUP BY DiscountId';
      return DB.query(q, [DocNo]).then(function (res) {
        return DB.fetchAll(res);
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
      return DB.query('SELECT pt.Amount, pt.ChangeAmount, pt.OverTenderTypeId  FROM ' + DB_CONFIG.tableNames.bill.payTransactionsOverTender + ' AS pt WHERE DocNo = ?', [DocNo]).then(function (res) {
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

  // var creatBodyData = function(DocNo){
  //   $q.all({
  //     header: self.getBillHeader(DocNo),
  //     items: self.getBillItems(DocNo),
  //     transactions: self.getBillTransactions(DocNo),
  //     tenderDiscounts: self.getTenderDiscounts(DocNo)
  //   }).then(function(data){
  //     self.creatRecieptBody(data);
  //
  //     self.creatRecieptFooter(data.header.DocNo, data.header.Tax);
  //
  //     printer.addCut(printer.CUT_FEED);
  //
  //     printer.send();
  //   }, function(ex){
  //     console.log(ex);
  //   });
  // }

    self.fetchData = function (DocNo) {
      return $q.all({
        printData: PrinterSettings.get(),
        header: self.getBillHeader(DocNo),
        items: self.getBillItems(DocNo),
        transactions: self.getBillTransactions(DocNo),
        tenderDiscounts: self.getTenderDiscounts(DocNo),
        transactionOT: self.getBillTransactionOT(DocNo)
      }).then(function (data) {
        return $q.all({
          shift: ShiftService.getById(data.header.ShiftId),
          machine: SettingsService.getMachine(data.header.MachineId),
          cashier: AuthService.getUserById(data.header.CashierId)
        }).then(function (footerData) {
          data.footerData = footerData;
          return data;
        });
      }, function (ex) {
        console.log(ex);
      });
    };

    self.openDrawer = function () {
      printer = PrintService.getPrinter();
      if (printer) {
        printer.addPulse();
      }
    };

    self.prepare = function (DocNo) {

      self.fetchData(DocNo).then(function (data) {

        if (data && data.header) {
          self.creatRecieptHeader();

          self.creatRecieptBody(data, true);

          self.creatRecieptFooter(data.header.DocNo, data.header.Tax);

          printer.addCut(printer.CUT_FEED);

          // printer.send();
        } else {
          console.log('bill not available');
        }
      });
    };

    var prepBody = function (header, items) {
      var data = [];

      var subTotal = 0;


      data.push(newLine(horizontalLine()));

      data.concat(itemBlock(items, subTotal));

      if (header.DocType == 'SA' || header.DocType == 'VD') {
        // console.log(data.tenderDiscounts);
        data.push(itemLine('SUBTOTAL', '$' + subTotal.toFixed(2)));
        if (data.tenderDiscounts && data.tenderDiscounts.length > 0) {
          var tenderDisAmount = 0;
          angular.forEach(data.tenderDiscounts, function (row) {
            PrintService.addLine(row.Description1, (row.Amount > 0 ? '-' : '+') + row.Amount.toFixed(2));
            tenderDisAmount += row.Amount;
          });

          PrintService.addLine('SUBTOTAL After Discount', '$' + (subTotal - tenderDisAmount).toFixed(2));
        }
        PrintService.addLine('TOTAL', '$' + (data.header.Total.toFixed(2)));
        var change = null, forfeited = null;
        angular.forEach(data.transactions, function (row) {
          // console.log(row);
          PrintService.addLine(row.Description1 || 'ROUNDED', '$' + (row.Amount.toFixed(2)));
          if (row.ChangeAmount > 0) {
            if (row.Cash == 'true' ) {
              change = row.ChangeAmount.toFixed(2);
            } else {
              forfeited = row.ChangeAmount.toFixed(2);
            }

          }
        });
        if (change) {
          printer.addText('\nChange Due: $' + change + '\n');
        } else if (forfeited) {
          printer.addText('\nForfeited : $' + forfeited + '\n');
        }
      }
      printer.addText('\n');

      if (withSubTotalSection && location.Tax5Option == 3) { //Tax inclusive
        printer.addText('Inc of ' + location.Tax5Desc1 + ' $' + data.header.Tax.toFixed(2) + '\n\n');
      }
    };

    var horizontalLine = function () {
      var text = ' ';
      for (var i = 1; i <= ($localStorage.printeSettings.maxCharsPerLine - 2); i++) {
        text += '-';
      }
      text += ' \n';
      return text;
    };

    var newLine = function (text, align, bold) {
      return { text: text, styles: { align: align ? align : 'normal', weight: bold ? bold : 'normal' } };
    };

    var itemBlock = function (items, subTotal) {
      var rows = [];
      angular.forEach(items, function (row) {
        var sTotal = (row.SubTotal + row.Tax5Amount).roundTo(2);
        var text = row.Desc1;
        if (row.ParentItemLineNumber > 0) {
          text = '  ' + text;
        }
        if (row.ItemType == 'MOD') {
          text += ' **';
        } else if (row.TakeAway == 'true') {
          text += ' *';
        }


        rows.push(newLine(itemLine(text, ' ' + (sTotal.toFixed(2)), '' + row.Qty)));

        subTotal += sTotal;
        if (row.discounts) {
          angular.forEach(row.discounts, function (discount) {
            if (discount.Description1) {
              if (!discount.DiscountAmount) {
                discount.DiscountAmount = 0;
              }
              rows.push(newLine(tabbedItemLine(discount.Description1, ' ' + (discount.DiscountAmount * -1)).toFixed(2)));
              subTotal -= discount.DiscountAmount ? discount.DiscountAmount : 0;
            }

          });
        }

        if (row.ReasonId) {
          rows.push(newLine('\tReason    : ' + row.ReasonDesc1 + '\n'));
          rows.push(newLine('\tReference : ' + (row.RefCode ? row.RefCode : '') + '\n'));
        }
      });
      return rows;
    };

    var tabbedItemLine = function (startBlock, endBlock) {
      if (startBlock) {
        var lengths = {
          start: startBlock.length,
          end: endBlock ? endBlock.length : 0,
          spaces: 0,
          total: $localStorage.printeSettings.maxCharsPerTabbedLine,
          startBlockMaxLength: 0
        };
        if (endBlock) {
          lengths.startBlockMaxLength = lengths.total - 12;

          lengths.spaces = lengths.startBlockMaxLength - startBlock.length;
        } else {
          lengths.startBlockMaxLength = lengths.total - 1;
          lengths.spaces = lengths.total - startBlock.length;
        }

        if (startBlock.length > lengths.startBlockMaxLength) {
          startBlock = startBlock.slice(0, (lengths.startBlockMaxLength - 2));
          startBlock += '...';
        }

        if (length.spaces < 1) {
          length.spaces = 1;
        }


        var text = '\t' + startBlock + addSpaces(lengths.spaces);
        if (lengths.end < 12) {
          text += addSpaces(12 - lengths.end);
        }
        return text + endBlock + '\n';
      }
    };

    var addSpaces = function (count) {
      var text = '';
      for (var i = 1; i <= count; i++) {
        text += ' ';
      }
      return text;
    };

    var itemLine = function (startBlock, endBlock, qtyBlock) {

      if (startBlock && endBlock) {
        var lengths  = {
          start: startBlock.length,
          end: endBlock.length,
          qty: qtyBlock ? qtyBlock.length : 0,
          spaces: 0,
          total: $localStorage.printeSettings.maxCharsPerLine,
          startBlockMaxLength: 0
        };

        lengths.startBlockMaxLength = lengths.total - (4 + 12 + 2); // 4: qty, 12: price

        if (startBlock.length > lengths.startBlockMaxLength) {
          startBlock = startBlock.slice(0, (lengths.startBlockMaxLength - 2));
          startBlock += '...';
        }

        lengths.spaces = ((lengths.total - ((lengths.qty ? 4 : 0) + 12)) - lengths.start );
        lengths.spaces  = lengths.spaces < 1 ? 1 : lengths.spaces;

        if (qtyBlock) {
          addSpaces(3 - lengths.qty);
          printer.addText(qtyBlock + ' ');
        }

        var text = startBlock + addSpaces(lengths.spaces);

        if (lengths.end < 12) {
          text += addSpaces(12 - lengths.end);
        }

        return endBlock + '\n';
      }
    };

    /*Yi Yi Po*/
    self.fetchSuspendData = function (DocNo, bill) {
      return Restangular.one('GetSuspendBill').get({DocNo: DocNo}).then(function (res) {
        try {
          var bills = JSON.parse(res);
          var header = ItemService.calculateTotal( _.first(bills.DBSuspendBillHeader));
          if (bill == undefined) {
            var items = bills.DBSuspendBillDetail;
          }
          else {
            var items = bill.SuspendBillFilter;
            angular.forEach(bill.SuspendBillDetail, function (value, key) {
              if (value.SuspendDepDocNo == '' && value.ItemType != 'RND') {
                console.log(value);
                bill.SuspendBillFilter.push(value);
              }
            });
          }
          _.forEach(items, function (item) {
            var itemdiscounts = [];
            _.forEach(bills.DBSuspendBillDiscounts, function (discount) {
              if (item.LineNumber == discount.LineNumber) {
                var seqPromise = DiscountService.getDiscountById(discount.DiscountId);
                seqPromise.then(function (s) {
                  discount.Description1 = s.Description1;
                  discount.Description2 = s.Description2;
                  itemdiscounts.push(discount);
                });
              }
            });
            item.discounts = itemdiscounts;
          });
          items = _.sortBy(items, 'LineNumber');
          if (header) {
            return {
              header: header,
              items: items
            };
          }
          else {
            return $q.reject('Unable to fetch suspended bills');
          }
        } catch (e) {
          return {};
        }
      }).then(function (data) {
        return $q.all({
          printData: PrinterSettings.get(),
          shift: ShiftService.getById(data.header.ShiftId),
          machine: SettingsService.getMachine(data.header.MachineId),
          cashier: AuthService.getUserById(data.header.CashierId)
        }).then(function (footerData) {
          data.footerData = footerData;
          return data;
        });
      }, function (ex) {
        console.log(ex);
      });
    };
    self.printSuspend = function (DocNo, bill) {

      if (PrintService.isConnected()) {
        try {
          printer = PrintService.getPrinter();

          if (printer) {
            self.fetchSuspendData(DocNo, bill).then(function (data) {

              printData = data.footerData.printData;

              if (data && data.header && data.footerData) {

                data.header.HeaderTitle = 'Suspend';

                self.creatRecieptHeader();

                self.creatRecieptBody(data, false);

                self.creatRecieptFooter(data.header, data.footerData);

                printer.addCut(printer.CUT_FEED);

                printer.send();
              } else {
                console.log('bill not available');
              }
            });
          }

        } catch (e) {
          console.log(e);
        }
      }
      else {
        Alert.success('printer not connected', 'Error');
      }
    };
  /*--*/

  }]);
