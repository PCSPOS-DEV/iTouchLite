'use strict';
angular.module('itouch.services')
.service('Reciept', ['$log', 'PrinterSettings', 'PrintService', 'DB', 'DB_CONFIG', '$q', 'ItemService', 'AuthService', 'ShiftService', 'ControlService', 'LocationService', 'SettingsService',
  function ($log, PrinterSettings, PrintService, DB, DB_CONFIG, $q, ItemService, AuthService, ShiftService, ControlService, LocationService, SettingsService) {
  var self = this;
  var data = null;
  var printer = PrintService.getPrinter();
  var location = LocationService.currentLocation;
  console.log(location);

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
    angular.forEach(data.transactions, function(row){
      console.log(row);
      PrintService.addLine(row.Description1 || 'ROUNDED', "$"+(row.Amount.toFixed(2)));
    });
    printer.addText('\n');
  }

  self.creatRecieptFooter = function(DocNo, Tax){
    if(location.Tax5Option == 3){ //Tax inclusive
      printer.addText('Inc of '+location.Tax5Desc1+' $'+ Tax.toFixed(2) +'\n\n');
    }

    printer.addTextAlign(printer.ALIGN_CENTER);
    var bDate = ControlService.getBusinessDate();
    var shift = ShiftService.getCurrent();
    var user = AuthService.currentUser();
    var now = moment().format('DD/MM/YYYY hh:mm:ss A');
    var machine = SettingsService.getCurrentMachine();

    angular.forEach(data.Footer, function(row){
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
    printer = PrintService.getPrinter();



    creatBodyData(DocNo);

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
    return DB.query("SELECT pt.Amount, tt.Description1  FROM " + DB_CONFIG.tableNames.bill.payTransactions + " AS pt LEFT OUTER JOIN "+ DB_CONFIG.tableNames.bill.tenderTypes +" AS tt ON pt.PayTypeId = tt.Id WHERE DocNo = ?", [DocNo]).then(function (res) {
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
      //
      if(PrintService.isConnected()){
        try {
          printer.send();
        } catch(e){
          console.log(e);
        }
      } else {
        Alert.success('Not connected', 'Error');
      }
    });
  }

}]);