/**
 * Created by shalitha on 21/6/16.
 */
angular.module('itouch.services')
  .service('FunctionsService', ['DB', 'DB_CONFIG', '$q', function (DB, DB_CONFIG, $q) {
    var self = this;

    self.fetch = function () {
      var deferred = $q.defer();
      DB.createTable(table);
      DB.select(DB_CONFIG.tableNames.keyboard.functions, 'COUNT(*) AS count').then(function (res) {
        if (DB.fetch(res)['count'] == 0) {
          angular.forEach(functions, function (fn) {
            DB.addQueryToQueue('INSERT INTO ' + DB_CONFIG.tableNames.keyboard.functions + ' VALUES(?,?,?,?,?,?,?,?,?)', fn);
          });
        }
        deferred.resolve(true);
      });
      syncLog.log('  Functions Sync Complete', 1);
      return deferred.promise;
    };

    self.get = function (type) {
      var deferred = $q.defer();
      var where = null;
      if (type) {
        where = {columns: 'Type = ? AND Inactive = ?', data: [type, false]};
      }
      DB.select(DB_CONFIG.tableNames.keyboard.functions, '*', where, 'Code').then(function (result) {
        var functions = DB.fetchAll(result);
        deferred.resolve(functions);
      }, function (err) {
        deferred.reject(err.message);
      });
      return deferred.promise;
    };

    self.getSalesFunctions = function () {
      return self.get('V');
    };

    self.getTenderFunctions = function () {
      return self.get('T');
    };

    self.insert = function (data, toQueue) {
      if (toQueue) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.keyboard.functions, data);
      } else {
        return DB.insert(DB_CONFIG.tableNames.keyboard.functions, data);
      }
    };

    self.update = function (data, where, toQueue) {
      if (toQueue) {
        DB.addUpdateToQueue(DB_CONFIG.tableNames.keyboard.functions, data, where);
      } else {
        return DB.update(DB_CONFIG.tableNames.keyboard.functions, data, where);
      }
    };


    self.getNextCode = function () {
      return DB.max(DB_CONFIG.tableNames.keyboard.functions, 'Code').then(function (code) {
        return ++code;
      });

    };

    var table = {
      name: tableNames.keyboard.functions,
      columns: [
        { name: 'Code', type: 'INT NOT NULL PRIMARY KEY' },
        { name: 'Description1', type: 'TEXT' },
        { name: 'Description2', type: 'TEXT' },
        { name: 'Name', type: 'TEXT NOT NULL' },
        { name: 'Inactive', type: 'BOOLEAN' },
        { name: 'Transact', type: 'BOOLEAN' },
        { name: 'Type', type: 'TEXT' },
        { name: 'AccessLevel', type: 'INT' },
        { name: 'DisplayOnTop', type: 'BOOLEAN' }
      ],
      keep: true
    };
    var functions = [
        // [1, 'Void Transaction', null, 'VoidFunction', true, false, 'V', 1, false],
        [3, 'Suspend', null, 'CallSuspendBill', false, true, 'V', 1, false],
        [4, 'Refund', null, 'ReFundDeposit', true, false, 'F', 1, false],
        // [6, 'Shift Exit', null, 'shiftexit', true, false, 'F', 1, false],
        // [7, 'Open Shift', null, 'openshift', true, false, 'V', 1, false],
        // [8, 'Void Item,', null, 'VoidItem', true, true, 'V', 1, false],
        // [9, 'Declare Cash Later', null, 'dcl', true, false, 'F', 1, false],
        // [10, 'Close Shift', null, 'closeshift', true, false, 'F', 1, false],
        // [11, 'Search', null, 'Search', true, false, 'F', 1, false],
        // [12, 'Search Receipt', null, 'SearchReceipt', true, false, 'V', 1, false],
        // [21, 'Activate Pump', null, 'ActivatePump', true, true, 'V', 1, false],
        // [22, 'Card Sales', null, 'SellMifare', false, true, 'V', 1, false],
        // [23, 'Force Conclude (Y)', null, 'ForceConclusion', true, true, 'V', 1, false],
        // [24, 'Mifare Topup', null, 'MiFareTopUp', false, false, 'V', 8, false],
        // [26, 'Open Drawer', null, 'OpenDrawer', true, false, 'V', 1, false],
        // [27, 'Print Receipt', null, 'RePrintReceipt', true, false, 'V', 1, false],
        // [30, 'VIP', null, 'VipPricelvl', false, true, 'V', 1, false],
        // [31, 'Mifare Refund', null, 'MiFareRefund', false, false, 'V', 1, false],
        // [32, 'Price Level', null, 'PriceLevel', true, false, 'V', 1, false],
        // [35, 'Contribution', null, 'DisplayContribution', true, false, 'V', 1, false],
        // [37, 'Deposit', null, 'DepositOption', true, false, 'V', 1, false],
        // [38, 'Pay Out', null, 'PayOutCash', true, false, 'V', 1, false],
        // [39, 'Receive In', null, 'ReceiveInCash', true, false, 'V', 1, false],
        // [40, 'Buy Foreign Currency', null, 'CallCurrencyExchange', true, false, 'V', 1, false],
        // [41, 'Change Analysis', null, 'ChangeSaleHeader', true, false, 'V', 1, false],
        // [42, 'Browser', null, 'winbrowser', true, false, 'V', 1, false],
        // [43, 'Version', null, 'showversion', true, false, 'V', 1, false],
        // [44, 'On Hand', null, 'ViewOnHand', true, false, 'V', 1, false],
        // [45, 'ez-link', null, 'ezlinkoption', true, false, 'V', 1, false],
        // [46, 'Check Referrer', null, 'CallChkRefAward', true, true, 'V', 1, false],
        // [47, 'Present Bill', null, 'PrintSuspendBill', true, true, 'V', 1, false],
        // [48, 'Card Topup', null, 'MiFareTopUpTo', true, true, 'V', 1, false],
        // [49, 'Calculate Qty', null, 'CalculateQty', true, true, 'V', 1, false],
        // [50, 'Vip Redeem', null, 'CallVipItemRedeem', false, false, 'V', 1, false],
        // [51, 'Check Referrer', null, 'CallChkRefAward', true, false, 'V', 1, false],
        // [52, 'Suspend Void Item', null, 'VoidSuspendItem', true, true, 'V', 1, false],
        // [53, 'Cancel Order', null, 'CancelOrder', true, false, 'V', 1, false],
        // [54, 'Change Table', null, 'ChangeTable', true, true, 'V', 1, false],
        // [55, 'Special Order', null, 'SpecialOrder', true, true, 'V', 1, false],
        // [56, 'Item Remark', null, 'TransactionRemark', true, true, 'V', 1, false],
        // [81, 'Foreign Exchange', null, 'callforex', true, true, 'T', 1, false],
        // [82, 'Toggle Tax', null, 'toggletax', true, true, 'T', 1, false],
        // [83, 'Redeem', null, 'Redemption', false, true, 'T', 1, false],
        // [84, 'Cash Redeem', null, 'CallCashRedeem', false, true, 'T', 1, false],
        // [85, 'Wastage', null, 'TenderWasteage', false, true, 'T', 1, false],
        // [86, 'Tender Remark', null, 'TenderRemarks', true, false, 'T', 1, false],
        [87, 'Payment Made', null, 'PaymentMade', false, true, 'T', 1, false],
        // [88, 'VIPs', null, 'vipdiscount', false, true, 'T', 1, false],
        // [89, 'Staff Usage', null, 'TenderStaff', false, true, 'T', 1, false],
        [89, '', null, 'TenderStaff', false, true, 'T', 1, false],
        [90, 'Discount', null, 'Discount', false, true, 'T', 1, false],
        // [91, 'Deposit', null, 'TenderDeposit', true, true, 'T', 1, false],
        // [92, 'Force Conclude (R)', null, 'ForceConclusionRed', true, false, 'V', 1, false],
        // [93, 'Void TopUp', null, 'VoidTopUp', true, false, 'V', 1, false],
        // [94, 'Void Card Sales', null, 'VoidCardSales', false, false, 'V', 1, false],
        // [96, 'Query Card', null, 'QueryMifareCard', false, true, 'V', 1, false],
        // [97, 'Change Language', null, 'ChangeLanguage', true, false, 'V', 1, false],
        // [98, 'Search Barcode', null, 'BarcodeSearch', true, false, 'V', 1, false],
        // [99, 'Reprint TopUp', null, 'RePrintTopUpReceipt', true, false, 'V', 1, false],
        [101, 'Abort', null, 'AbortFunction', false, true, 'V', 1, true],
        [102, 'Void', null, 'VoidTop', false, false, 'V', 1, true],
        [103, 'History', null, 'ReceiptHistory', false, false, 'V', 1, true],
        // [104, 'Suspend', null, 'SuspendTop', false, true, 'V', 1, false],
        // [106, 'Clear', null, 'ClearTop', true, true, 'V', 1, true],
        // [200, 'Add Float', null, 'AddFloat', true, false, 'V', 1, false],
        // [201, 'Change Price', null, 'ChangeItemPrice', true, true, 'V', 3, false],
        // [202, 'Day End Closing', null, 'DayEndClosing', true, false, 'V', 1, false],
        // [205, 'Combine Bills', null, 'CombineBills', true, true, 'V', 1, false],
        // [206, 'Split Bills', null, 'SplitBills', true, true, 'V', 1, false],
        // [207, 'Present Bill', null, 'PresentBill', true, true, 'V', 1, false],
        // [214, 'Change Pax', null, 'ChangePax', true, true, 'V', 1, false],
        // [215, 'Deposit Reprint', 'Deposit Reprint', 'DepositReprint', true, false, 'V', 1, false],
        // [216, 'Deposit Recall', 'Deposit Recall', 'DepositRecall', false, true, 'V', 1, false],
        // [217, 'Deposit Forfeit', 'Deposit Forfeit', 'DepositForfeit', true, false, 'V', 1, false],
        // [218, 'Deposit Refund', 'Deposit Refund', 'DepositRefund', false, true, 'V', 1, false],
        // [219, 'DepositDateChg', 'DepositDateChg', 'DepositCollectionDateChg', true, false, 'V', 1, false],
        [998, 'QTY +', 'QTY +', 'QtyPlus', false, true, 'V', 1, false],
        [999, 'QTY -', 'QTY -', 'QtyMinus', false, true, 'V', 1, false],
        [1000, 'Food Modifiers', null, 'FoodModifier', false, true, 'V', 1, true],
        [1001, 'Drink Modifiers', null, 'BeveragesModifiers', false, true, 'V', 1, true],
        [1002, 'Full T/A', null, 'FullTakeaway', false, true, 'V', 1, true],
        [1003, 'Partial T/A', null, 'PartialTakeaway', false, true, 'V', 1, true],
        [1005, 'Tag', null, 'OrderTag', false, true, 'V', 1, true],
        [1006, 'Discount', null, 'Discount', false, true, 'V', 1, false],
        [1008, 'Refund Item', null, 'ItemReverse', false, true, 'V', 1, false],
        // [1009, 'Reports', null, 'winreportc40', false, true, 'V', 1, false],
        [1010, 'Shift Option', null, 'Shiftoption', false, false, 'V', 1, false],
        // [2000, 'KeyBoard', null, 'KeyBoardTop', false, true, 'V', 1, false],
        // [2001, '', null, 'ItemDetailTop', false, true, 'V', 1, false],
        // [2001, '', null, 'ItemDetailTop', false, true, 'V', 1, false],
        [2001, 'Item Detail', null, 'ItemDetailTop', false, true, 'V', 1, false],
        [2002, 'Search', null, 'SearchTop', false, true, 'V', 1, false],
        // [10000, 'Lock Machine', null, 'LockMachineTop', true, false, 'V', 1, true]
    ];
  }]);
