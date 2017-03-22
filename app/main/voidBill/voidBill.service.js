/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory("VoidBillService", ['$q', '$localStorage', 'DB', 'DB_CONFIG', 'ItemService', 'BillService', 'ControlService', function ($q, $localStorage, DB, DB_CONFIG, ItemService, BillService, ControlService) {
    var self = this;

    self.getBillList = function(businessDate){
      return DB.select(DB_CONFIG.tableNames.bill.header, 'DocNo, SubTotal, DiscAmount, Tax1Amount, Tax2Amount, Tax3Amount, Tax4Amount, Tax5Amount, Tax1DiscAmount, Tax2DiscAmount, Tax3DiscAmount, Tax4DiscAmount, Tax5DiscAmount',
        { columns: "BusinessDate=? AND (VoidDocNo IS NULL OR VoidDocNo = '' ) AND DocType = 'SA' ORDER BY SysDateTime DESC", data: [businessDate] }).then(function(res){
          var data = DB.fetchAll(res);
          // console.log(data);
          if(data){
            data = _.map(data, function(bill){
              return ItemService.calculateTotal(bill);
            });
            return data;
          }
      });
    }

    self.voidBill = function(DocNo){
      return $q.all({
        header: BillService.getBillHeader(DocNo),
        items: BillService.getBillDetails(DocNo),
        transactions: BillService.getTransactions(DocNo),
        discounts: BillService.getDiscounts(DocNo)

      }).then(function(data){
        var orgHeader = angular.copy(data.header);
        data.header = reverse(data.header, ['Qty', 'SubTotal', 'DiscAmount', 'Tax1Amount', 'Tax2Amount', 'Tax3Amount', 'Tax4Amount', 'Tax5Amount', 'Tax1DiscAmount', 'Tax2DiscAmount', 'Tax3DiscAmount', 'Tax4DiscAmount', 'Tax5DiscAmount']);
        data.header.DocType = 'VD';
        data.header.DocNo = BillService.getCurrentReceiptId();
        orgHeader.VoidDocNo = data.header.DocNo;

        data.items = _.map(data.items, function(item){
          item.DocNo = data.header.DocNo;
          return reverse(item, ['Qty', 'SubTotal', 'DiscAmount', 'Tax1Amount', 'Tax2Amount', 'Tax3Amount', 'Tax4Amount', 'Tax5Amount', 'Tax1DiscAmount', 'Tax2DiscAmount', 'Tax3DiscAmount', 'Tax4DiscAmount', 'Tax5DiscAmount']);
        });

        data.transactions = _.map(data.transactions, function(item){
          item.DocNo = data.header.DocNo;
          return reverse(item, ['Amount', 'ChangeAmount']);
        });

        data.discounts = _.map(data.discounts, function(item){
          item.DocNo = data.header.DocNo;
          return reverse(item, ['DiscountAmount']);
        });

        DB.clearQueue()
        DB.addInsertToQueue(DB_CONFIG.tableNames.bill.header, data.header);
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.header, orgHeader, { columns: 'DocNo=?', data:[orgHeader.DocNo] });
        DB.addInsertToQueue(DB_CONFIG.tableNames.bill.detail, data.items);
        DB.addInsertToQueue(DB_CONFIG.tableNames.bill.payTransactions, data.transactions);
        DB.addInsertToQueue(DB_CONFIG.tableNames.discounts.billDiscounts, data.discounts);
        return DB.executeQueue().then(function(){
          ControlService.counterDocId(data.header.DocNo);
          return data.header.DocNo;
        });
      });
    }

    var reverse = function(item, columns){
      if(columns && columns.length > 0){
        angular.forEach(columns, function(col){
          if(item && item[col] && _.isNumber(item[col])){
            item[col] *= -1;
          }
        });
        return item;
      } else {
        return item;
      }
    }

    return self;
  }]);
