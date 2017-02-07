'use strict';
angular.module('itouch.services')
.service('Report', ['$log', 'PrinterSettings', 'PrintService', 'DB', 'DB_CONFIG', '$q', 'ItemService', 'AuthService', 'ShiftService', 'ControlService', 'LocationService', 'SettingsService', 'Alert',
  function ($log, PrinterSettings, PrintService, DB, DB_CONFIG, $q, ItemService, AuthService, ShiftService, ControlService, LocationService, SettingsService, Alert) {
  var self = this;
  var data = null;
  var printer = null;
  var location = null;
  var bDate = null;
  var shift = null;
  var machine = null;
  var now = null;
  var user = null;

  var setParameters = function(){
    printer = PrintService.getPrinter();
    location = LocationService.currentLocation;
    bDate = ControlService.getBusinessDate();
    shift = ShiftService.getCurrent();
    user = AuthService.currentUser();
    now = moment().format('DD/MM/YYYY hh:mm:ss A');
    machine = SettingsService.getCurrentMachine();
  }

  self.getAll = function(){
    PrinterSettings.get().then(function(res){
      $log.log(res);
      data = res;
    });
  }
  self.getAll();

  self.creatRecieptHeader = function(){

    printer.addTextAlign(printer.ALIGN_CENTER);

    angular.forEach(data.Header, function(row){
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

  self.creatRecieptBody = function(data){


    printer.addTextAlign(printer.ALIGN_LEFT);
    PrintService.addHLine();

    angular.forEach(data.items, function(row){
      PrintService.addLine(row.Desc1, "$"+(row.SubTotal.toFixed(2)), ""+row.Qty);
      if(row.discounts){
        angular.forEach(row.discounts, function(discount){
          PrintService.addTabbedLine(discount.Description1, "-$"+(discount.DiscountAmount ? discount.DiscountAmount.toFixed(2) : 0))
        });
      }
    });

    PrintService.addHLine();

    PrintService.addLine('SUBTOTAL', "$"+(data.header.Total.toFixed(2)));
    PrintService.addLine('TOTAL', "$"+(data.header.Total.toFixed(2)));
    var change = null;
    angular.forEach(data.transactions, function(row){
      // console.log(row);
      PrintService.addLine(row.Description1 || 'ROUNDED', "$"+(row.Amount.toFixed(2)));
      if(row.Cash == 'true' && row.ChangeAmount > 0){
        change = row.ChangeAmount.toFixed(2);
      }
    });
    if(change){
      printer.addText('\nChange Due: $'+change+"\n");
    }
    printer.addText('\n');
  }

  self.creatRecieptFooter = function(sh){
    setParameters();
    if(sh){
      shift = sh;
    }
    printer.addTextAlign(printer.ALIGN_CENTER);
    printer.addText('\nBDate: '+bDate.format('DD/MM/YYYY')+' Shift: '+ shift.Description1 +' M/C: '+ machine.Code +'\n');
    printer.addText(now+' User: '+ user.Id +'\n');
  }

  self.print = function(DocNo){
    if(PrintService.isConnected()){
      try {
        printer = PrintService.getPrinter();
        creatBodyData(DocNo);
      } catch(e){
        console.log(e);
      }
    } else {
      Alert.success('printer not connected', 'Error');
    }
  }

    self.printAddFloat = function(floatAmount){
      if(PrintService.isConnected()){
        try {
          printer = PrintService.getPrinter();
          self.creatRecieptHeader();
          PrintService.addHLine();
          printer.addTextSize(2, 2);
          PrintService.addTitle('Add Float\n');
          printer.addTextSize(1, 1);
          PrintService.addLine('Amount :', (floatAmount.toFixed(2)));

          self.creatRecieptFooter();

          printer.addCut(printer.CUT_FEED);

          printer.send();
        } catch(e){
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    }

    self.printDeclareCash = function(shift, amount){
      if(PrintService.isConnected()){
        try {
          printer = PrintService.getPrinter();
          self.creatRecieptHeader();
          printer.addTextSize(2, 2);
          PrintService.addTitle('Declare Cash\n');
          printer.addTextSize(1, 1);
          PrintService.addHLine();
          PrintService.addLine('Cash in Drawer :', (amount.toFixed(2))+'\n');

          self.creatRecieptFooter(shift);

          printer.addCut(printer.CUT_FEED);

          printer.send();
        } catch(e){
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }
    }


    self.getBillHeader = function (DocNo) {
    return DB.query("SELECT *  FROM " + DB_CONFIG.tableNames.bill.header + " WHERE DocNo = ?", [DocNo]).then(function (res) {
      var item = DB.fetch(res);
      item = ItemService.calculateTotal(item);
      // item.SubTotal = item.SubTotal + item.Tax;
      return item;
    });
  }

  self.getBillItems = function (DocNo) {
    var q = "SELECT de.*, bd.DiscountAmount, d.Description1, d.Description2 "
    +"FROM BillDetail AS de "
    +"LEFT OUTER JOIN BillDiscounts AS bd ON bd.ItemId = de.ItemId AND bd.LineNumber = de.LineNumber AND de.DocNo = bd.DocNo "
    +"LEFT OUTER  JOIN Discounts AS d ON d.Id = bd.DiscountId";
    return DB.query(q + " WHERE de.DocNo = ?", [DocNo]).then(function (res) {
      var items = {};
      angular.forEach(DB.fetchAll(res), function (item) {
        if(item){
          var exItem = items[""+item.LineNumber+item.ItemId];
          if(!exItem){
            item = ItemService.calculateTotal(item);
            item.SubTotal = item.SubTotal + item.Tax;
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

      console.log(items);

      return items;
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

  var creatBodyData = function(DocNo){
    $q.all({
      header: self.getBillHeader(DocNo),
      items: self.getBillItems(DocNo),
      transactions: self.getBillTransactions(DocNo)
    }).then(function(data){
      self.creatRecieptHeader();
      self.creatRecieptBody(data);

      self.creatRecieptFooter(data.header.DocNo, data.header.Tax);

      printer.addCut(printer.CUT_FEED);

      printer.send();
    });
  }

  self.printShiftClosingReport = function(shiftId){
    setParameters();
    $q.all({
      shift: ShiftService.getById(shiftId),
      header: ShiftService.getHeaderDetails(shiftId),
      trans: ShiftService.getTransDetails(shiftId)
    }).then(function(data){
      console.log(data);
      if(data.header.void){
        data.header.sales.Total -= data.header.void.Total;
        data.header.sales.Discount -= data.header.void.Discount;
      }
      var salesTotal = data.header.sales.Total - data.header.sales.Discount;

      if(PrintService.isConnected()){
        try {
          printer = PrintService.getPrinter();
          self.creatRecieptHeader();
          PrintService.addHLine();
          PrintService.addTitle('Shift Closing Report');
          PrintService.alignCenter();
          PrintService.addLine('Shift : '+ data.shift.Description1);
          PrintService.addLineBreak();
          PrintService.addLine('BUSINESS DATE : '+ bDate.format('DD/MM/YYYY'));
          PrintService.addLine('TAKEN BY : '+ user.Id);

          PrintService.addLineBreak();


          PrintService.alignLeft();
          PrintService.addLine('CASH IN DRAWER (INCLUDING FLOAT)');
          PrintService.addReportLine('DECLARED', (data.header.cashDeclared? data.header.cashDeclared.Total:0).toFixed(2));
          PrintService.addReportLine('ACTUAL', '0.00');
          PrintService.addTabbedLine('DIFFERENCE', '0.00');
          PrintService.addLineBreak();
          PrintService.addLineBreak();

          PrintService.addLine('SALES TRANSACTIONS');
          PrintService.addReportLine('GROSS SALES', (data.header.sales ? data.header.sales.Total: 0).toFixed(2));
          PrintService.addReportLine('DISCOUNT', (data.header.sales? data.header.sales.Discount: 0).toFixed(2));
          PrintService.addTabbedLine('SALES TOTAL', salesTotal.toFixed(2));
          PrintService.addLineBreak();
          PrintService.addLineBreak();

          PrintService.addLine('MISCELLANEOUS TRANSACTIONS');
          PrintService.addReportLine('R.A(FLOAT)', (data.header.float? data.header.float.Total:0).toFixed(2));
          PrintService.addReportLine('PAY OUT', (data.header.payOut ? data.header.payOut.Total:0).toFixed(2));
          PrintService.addReportLine('RECEIVE IN', (data.header.receiveIn ? data.header.receiveIn.Total:0).toFixed(2));
          PrintService.addTabbedLine('MICS TOTAL', (data.header.sales.Total||0).toFixed(2));
          PrintService.addReportLine('TRANSACTION TOTAL', (data.header.sales ? data.header.sales.Total:0).toFixed(2));
          PrintService.addLineBreak();
          PrintService.addLineBreak();

          PrintService.addLine('LOCAL COLLECTION');
          PrintService.addLine('  CASH COLLECTION (INCLUDING FLOAT)');
          PrintService.addReportLine('CASH', (data.trans.cash.Amount||0).toFixed(2), ""+data.trans.cash.ItemCount);
          PrintService.addReportLine('NON-CASH COLLECTION', (data.trans.nonCash.Amount||0).toFixed(2), ""+data.trans.nonCash.ItemCount);
          PrintService.addTabbedLine('LOCAL TOTAL', (data.trans.cash.Amount+ data.trans.nonCash.Amount).toFixed(2));
          PrintService.addLineBreak();
          PrintService.addLineBreak();

          PrintService.addReportLine('ITEM REVERSE', (data.header.float? data.header.float.Total:0).toFixed(2));
          PrintService.addReportLine('ABORT', (data.header.float? data.header.float.Total:0).toFixed(2));
          PrintService.addReportLine('TRANS VD', (data.header.float? data.header.float.Total:0).toFixed(2));
          PrintService.addReportLine('ITEM VD', (data.header.float? data.header.float.Total:0).toFixed(2));
          PrintService.addLineBreak();
          // PrintService.addReportLine('DRAWER OPEN', (data.header.float? data.header.float.Total:0).toFixed(2));
          PrintService.addReportLine('RECEIPT COUNT', (data.header.float? data.header.float.Total:0).toFixed(2));

          PrintService.alignCenter();
          PrintService.addLine(now+" "+' Machine : '+ machine.Code);
          PrintService.addLine("**");


          printer.addCut(printer.CUT_FEED);

          printer.send();
        } catch(e){
          console.log(e);
        }
      } else {
        Alert.success('printer not connected', 'Error');
      }

    }, function(ex){
      console.log(ex);
    });
  }
    // self.printShiftClosingReport(0);

}]);
