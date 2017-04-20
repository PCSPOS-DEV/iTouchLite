/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory("HistoryService", ['DB', 'DB_CONFIG', '$q', 'ItemService',
    function (DB, DB_CONFIG, $q, ItemService) {
      var self = this;

      self.getAll = function (bDate) {
        return DB.query("SELECT " +
          "h.DocNo, h.DocType, h.SubTotal, h.DiscAmount, h.Tax1Amount, h.Tax2Amount, h.Tax3Amount, h.Tax4Amount, h.Tax5Amount, " +
          "h.Tax1DiscAmount, h.Tax2DiscAmount, h.Tax3DiscAmount, h.Tax4DiscAmount, h.Tax5DiscAmount, " +
          "d.LineNumber, d.Desc1, d.Desc2, d.Qty  " +
          "FROM " + DB_CONFIG.tableNames.bill.header + " h INNER JOIN " + DB_CONFIG.tableNames.bill.detail + " d ON h.DocNo = d.DocNo WHERE h.BusinessDate = ? ORDER BY h.DocNo DESC", [bDate]).then(function (res) {
          var items = DB.fetchAll(res);
          var bills = {};
          var total = 0;

          angular.forEach(items, function (item) {
            // item = ItemService.calculateTotal(item);

            if (!bills[item.DocNo]) {
              bills[item.DocNo] = {
                DocNo: item.DocNo,
                DocType: item.DocType,
                DiscAmount: item.DiscAmount,
                Tax1Amount: item.Tax1Amount,
                Tax2Amount: item.Tax2Amount,
                Tax3Amount: item.Tax3Amount,
                Tax4Amount: item.Tax4Amount,
                Tax5Amount: item.Tax5Amount,
                Tax1DiscAmount: item.Tax1DiscAmount,
                Tax2DiscAmount: item.Tax2DiscAmount,
                Tax3DiscAmount: item.Tax3DiscAmount,
                Tax4DiscAmount: item.Tax4DiscAmount,
                Tax5DiscAmount: item.Tax5DiscAmount,
                SubTotal: item.SubTotal,
                // Total: (item.SubTotal + item.Tax5Amount),
                items: []
              };
              bills[item.DocNo] = ItemService.calculateTotal(bills[item.DocNo]);
            }
            bills[item.DocNo].items.push(_.pick(item, ['Desc1', 'Desc2', 'Qty']));
            // item = ItemService.calculateTotal(item);
            // bills[item.DocNo].items.push(item);
          });
          return bills;

        });
      }

      self.getTempHeader = function (DocNo) {
        return DB.query("SELECT *  FROM " + DB_CONFIG.tableNames.bill.header + " WHERE DocNo = ?", [DocNo]).then(function (res) {
          var item = DB.fetch(res);
          item = ItemService.calculateTotal(item);
          return item;
        });
      }

      self.getItems = function (DocNo) {
        return DB.query("SELECT *  FROM " + DB_CONFIG.tableNames.bill.detail + " WHERE DocNo = ?", [DocNo]).then(function (res) {
          return _.map(DB.fetchAll(res), function (item) {
            return ItemService.calculateTotal(item);
          });
        });
      }

      self.getTransactions = function (DocNo) {
        return DB.query("SELECT pt.Amount, tt.Description1  FROM " + DB_CONFIG.tableNames.bill.payTransactions + " AS pt LEFT OUTER JOIN "+ DB_CONFIG.tableNames.bill.tenderTypes +" AS tt ON pt.PayTypeId = tt.Id WHERE DocNo = ?", [DocNo]).then(function (res) {
          // return _.map(DB.fetchAll(res), function (item) {
          //   return ItemService.calculateTotal(item);
          // });
          return DB.fetchAll(res);
        });
      }

      self.getDiscounts = function (DocNo) {
        return DB.query("SELECT *  FROM " + DB_CONFIG.tableNames.discounts.billDiscounts + " WHERE DocNo = ?", [DocNo]).then(function (res) {
          // return _.map(DB.fetchAll(res), function (item) {
          //   return ItemService.calculateTotal(item);
          // });
          return DB.fetchAll(res);
        });
      }


      return self;
    }
  ]);
