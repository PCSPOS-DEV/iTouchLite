'use strict';
angular.module('itouch.services')
.service('Reciept', ['$log', 'PrinterSettings', 'PrintService', 'DB', 'DB_CONFIG', '$q', 'ItemService', 'AuthService', 'ShiftService', 'ControlService', 'LocationService', 'SettingsService', 'Alert',
  function ($log, PrinterSettings, PrintService, DB, DB_CONFIG, $q, ItemService, AuthService, ShiftService, ControlService, LocationService, SettingsService, Alert) {
  var self = this;
  var printData = null;
  var printer = PrintService.getPrinter();
  var location = LocationService.currentLocation;
  console.log(location);

  self.getAll = function(){
    PrinterSettings.get().then(function(res){
      printData = res;
    });
  }
  self.getAll();

  self.creatRecieptHeader = function(){

    printer.addTextAlign(printer.ALIGN_CENTER);

    angular.forEach(printData.Header, function(row){
      if(row.IsBold == "true"){
        printer.addTextStyle(false, false, true);
      } else {
        printer.addTextStyle(false, false, false);
      }

      if(row.Type == "Header" && row.Sequence == 1){
        printer.addTextSize(2, 2);
      } else {
        printer.addTextSize(1, 1);
      }
      printer.addText(row.Text+'\n');
    });
  }

  self.creatRecieptBody = function(data, withSubTotalSection){
    var subTotal = 0;


    printer.addTextAlign(printer.ALIGN_LEFT);
    PrintService.addHLine();

    angular.forEach(data.items, function(row){
      var sTotal = (row.SubTotal + row.Tax5Amount).roundTo(2);
      var text = row.Desc1;
      if(row.ParentItemLineNumber > 0){
        text = '  '+ text;
      }
      if (row.ItemType == 'MOD'){
        text += " **";
      } else if(row.TakeAway == 'true'){
        text += " *";
      }


      PrintService.addLine(text, " "+(sTotal.toFixed(2)), ""+row.Qty);
      subTotal += sTotal;
      if(row.discounts){
        angular.forEach(row.discounts, function(discount){
          if(discount.Description1){
            if(!discount.DiscountAmount){
              discount.DiscountAmount = 0;
            }
            PrintService.addTabbedLine(discount.Description1, " "+(discount.DiscountAmount*-1).toFixed(2));
            subTotal -= discount.DiscountAmount ? discount.DiscountAmount : 0;
          }

        });
      }

      if(row.ReasonId){
        printer.addText("\tReason    : "+row.ReasonDesc1+"\n");
        printer.addText("\tReference : "+(row.RefCode ? row.RefCode : "")+"\n");
      }
    });

    PrintService.addHLine();



    if(withSubTotalSection){
      // console.log(data.tenderDiscounts);
      PrintService.addLine('SUBTOTAL', "$"+subTotal.toFixed(2));
      if(data.tenderDiscounts && data.tenderDiscounts.length > 0){
        var tenderDisAmount = 0;
        angular.forEach(data.tenderDiscounts, function(row){
          PrintService.addLine(row.Description1, (row.Amount > 0 ?"-":"+") + row.Amount.toFixed(2));
          tenderDisAmount += row.Amount;
        });

        PrintService.addLine('SUBTOTAL After Discount', "$"+(subTotal-tenderDisAmount).toFixed(2));
      }
      PrintService.addLine('TOTAL', "$"+(data.header.Total.toFixed(2)));
      var change = null, forfeited = null;
      angular.forEach(data.transactions, function(row){
        // console.log(row);
        PrintService.addLine(row.Description1 || 'ROUNDED', "$"+(row.Amount.toFixed(2)));
        if(row.ChangeAmount > 0){
          if(row.Cash == 'true' ){
            change = row.ChangeAmount.toFixed(2);
          } else {
            forfeited = row.ChangeAmount.toFixed(2);
          }

        }
      });
      if(change){
        printer.addText('\nChange Due: $'+change+"\n");
      } else if (forfeited){
        printer.addText('\nForfeited : $'+forfeited+"\n");
      }
    }
    printer.addText('\n');

    if(withSubTotalSection && location.Tax5Option == 3){ //Tax inclusive
      printer.addText('Inc of '+location.Tax5Desc1+' $'+ data.header.Tax.toFixed(2) +'\n\n');
    }

  }

  self.creatRecieptFooter = function(DocNo){
    printer.addTextAlign(printer.ALIGN_CENTER);
    var bDate = ControlService.getBusinessDate();
    var shift = ShiftService.getCurrent();
    var user = AuthService.currentUser();
    var now = moment().format('DD/MM/YYYY hh:mm:ss A');
    var machine = SettingsService.getCurrentMachine();

    angular.forEach(printData.Footer, function(row){
      if(row.IsBold == "true"){
        printer.addTextStyle(false, false, true);
      } else {
        printer.addTextStyle(false, false, false);
      }

      printer.addText(row.Text+'\n');
    });

    printer.addText('\nBDate: '+bDate.format('DD/MM/YYYY')+' Shift: '+ shift.Description1 +' M/C: '+ machine.Code +'\n');
    printer.addText(now+' User: '+ user.Id + ' ' + DocNo +'\n');
  }

  self.print = function(DocNo){
    if(PrintService.isConnected()){
      try {
        printer = PrintService.getPrinter();

        fetchData(DocNo).then(function (data) {
          printData = data.printData;

          if(data && data.header){
            self.creatRecieptHeader();

            self.creatRecieptBody(data, true);

            self.creatRecieptFooter(data.header.DocNo, data.header.Tax);

            printer.addCut(printer.CUT_FEED);

            printer.send();
          } else {
            console.log("bill not available");
          }
        });

      } catch(e){
        console.log(e);
      }
    } else {
      Alert.success('printer not connected', 'Error');
    }



  }

  self.printVoid = function(DocNo){
      if(PrintService.isConnected()){
        try {
          printer = PrintService.getPrinter();

          fetchData(DocNo).then(function (data) {
            printData = data.printData;
            if(data && data.header){
              self.creatRecieptHeader();
              PrintService.addTitle("Transaction Void");
              PrintService.addTitle(data.header.SalesDocNo);
              self.creatRecieptBody(data, data.header.Tax, true);

              self.creatRecieptFooter(data.header.DocNo);

              printer.addCut(printer.CUT_FEED);

              printer.send();
            } else {
              console.log("bill not available");
            }
          });

        } catch(e){
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    }

    self.printAbort = function(DocNo){
      if(PrintService.isConnected()){
        try {
          printer = PrintService.getPrinter();

          fetchData(DocNo).then(function (data) {
            printData = data.printData;
            if(data && data.header){
              self.creatRecieptHeader();
              PrintService.addTitle("Abort");

              self.creatRecieptBody(data, false);

              self.creatRecieptFooter(data.header.DocNo, data.header.Tax);

              printer.addCut(printer.CUT_FEED);

              printer.send();
            } else {
              console.log("bill not available");
            }
          });

        } catch(e){
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    }

  self.getBillHeader = function (DocNo) {
    return DB.query("SELECT v.*, s.DocNo  AS SalesDocNo  FROM " + DB_CONFIG.tableNames.bill.header + " AS v LEFT OUTER JOIN " + DB_CONFIG.tableNames.bill.header + " AS s ON v.DocNo = s.VoidDocNo WHERE v.DocNo = ?", [DocNo]).then(function (res) {
      var item = DB.fetch(res);
      item = ItemService.calculateTotal(item);
      // item.SubTotal = item.SubTotal + item.Tax;
      return item;
    });
  }

  self.getBillItems = function (DocNo) {
    var q = "SELECT de.*, bd.DiscountAmount, d.Description1, d.Description2, r.Description1 AS ReasonDesc1, r.Description2 AS ReasonDesc2 "
    +"FROM BillDetail AS de "
    +"LEFT OUTER JOIN BillDiscounts AS bd ON bd.ItemId = de.ItemId AND bd.LineNumber = de.LineNumber AND de.DocNo = bd.DocNo "
    +"LEFT OUTER  JOIN Discounts AS d ON d.Id = bd.DiscountId AND bd.DiscountFrom = 'I' "
    +"LEFT OUTER  JOIN Reason AS r ON r.Code = de.ReasonId "
    return DB.query(q + "WHERE de.DocNo = ? ORDER BY de.LineNumber AND bd.SeqNo", [DocNo]).then(function (res) {
      var items = {};
      angular.forEach(DB.fetchAll(res), function (item) {
        if(item){
          var exItem = items[""+item.LineNumber+item.ItemId];
          if(!exItem){
            item = ItemService.calculateTotal(item);
            // item.SubTotal = item.SubTotal + item.Tax;
            item.discounts = [];
            if(item.DiscountAmount){
              item.discounts.push(_.pick(item, [ 'DiscountAmount', 'Description1', 'Description2' ]));
              item = _.omit(item, [ 'DiscountAmount', 'Description1', 'Description2' ]);
            }
            items[""+item.LineNumber+item.ItemId] = item;
          } else {
            if(item.DiscountAmount) {
              exItem.discounts.push(_.pick(item, ['DiscountAmount', 'Description1', 'Description2']));
            }
          }
        }

      });

      items = _.sortBy(_.values(items), 'LineNumber');
      return items;
    });
  }

  self.getTenderDiscounts = function(DocNo){
    var q = "SELECT SUM(bd.DiscountAmount) AS Amount, d.Description1 AS Description1 FROM BillDiscounts AS bd INNER JOIN Discounts AS d ON d.Id = bd.DiscountId INNER JOIN BillHeader AS bh ON bd.DocNo = bh.DocNo WHERE DiscountFrom = 'T' AND bh.DocNo = ? GROUP BY SeqNo";
    return DB.query(q, [DocNo]).then(function(res){
      return DB.fetchAll(res);
    });
  }

  self.getBillTransactions = function (DocNo) {
    return DB.query("SELECT pt.Amount, pt.ChangeAmount, pt.Cash, tt.Description1  FROM " + DB_CONFIG.tableNames.bill.payTransactions + " AS pt LEFT OUTER JOIN "+ DB_CONFIG.tableNames.bill.tenderTypes +" AS tt ON pt.PayTypeId = tt.Id WHERE DocNo = ?", [DocNo]).then(function (res) {
      // return _.map(DB.fetchAll(res), function (item) {
      //   return ItemService.calculateTotal(item);
      // });
      return DB.fetchAll(res);
    });
  }

  self.getBillDiscounts = function (DocNo) {
    return DB.query("SELECT *  FROM " + DB_CONFIG.tableNames.discounts.billDiscounts + " WHERE DocNo = ?", [DocNo]).then(function (res) {
      // return _.map(DB.fetchAll(res), function (item) {
      //   return ItemService.calculateTotal(item);
      // });
      return DB.fetchAll(res);
    });
  }

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

  var fetchData = function(DocNo){
    return $q.all({
      printData: PrinterSettings.get(),
      header: self.getBillHeader(DocNo),
      items: self.getBillItems(DocNo),
      transactions: self.getBillTransactions(DocNo),
      tenderDiscounts: self.getTenderDiscounts(DocNo)
    }, function(ex){
      console.log(ex);
    });
  }

  self.openDrawer = function(){
    printer = PrintService.getPrinter();
    if(printer){
      printer.addPulse();
    }
  }

}]);
