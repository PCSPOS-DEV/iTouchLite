
angular.module('itouch.services')
.service('TransactService', ['$q', 'DB', 'DB_CONFIG', 'ItemService', function ($q, DB, DB_CONFIG, ItemService) {
  var self = this;


  var getHeaderDetailsForMode = function (shiftId, mode, discounted, businessDate) {
    var q = 'SELECT ShiftId, ' +
      'COUNT(*) AS ItemCount, ' +
      'SUM(SubTotal) AS SubTotal, ' +
      'SUM(DiscAmount) AS DiscAmount, ' +
      'SUM(Tax1Amount) AS Tax1Amount, ' +
      'SUM(Tax2Amount) AS Tax2Amount, ' +
      'SUM(Tax3Amount) AS Tax3Amount, ' +
      'SUM(Tax4Amount) AS Tax4Amount, ' +
      'SUM(Tax5Amount) AS Tax5Amount, ' +
      'SUM(Tax1DiscAmount) AS Tax1DiscAmount, ' +
      'SUM(Tax2DiscAmount) AS Tax2DiscAmount, ' +
      'SUM(Tax3DiscAmount) AS Tax3DiscAmount, ' +
      'SUM(Tax4DiscAmount) AS Tax4DiscAmount, ' +
      'SUM(Tax5DiscAmount) AS Tax5DiscAmount ' +
      'FROM BillHeader WHERE BusinessDate=? ';
    var data = [businessDate];

    if (_.isUndefined(mode) || _.isNull(mode)) {
      // console.log(mode);
    }
    else {
      q += ' AND DocType IN (' + mode + ') ';
    }

    if (_.isUndefined(shiftId) || _.isNull(shiftId)) {} else {
      q += ' AND ShiftId = ? ';
      data.push(shiftId);
    }

    if (_.isUndefined(discounted) || _.isNull(discounted)) {} else {
      q += ' AND DiscAmount != 0 ';
      if (_.isNull(mode))
      {
        q += ' AND DocType !=\'AV\' ';
      }
      /*q += "AND DiscAmount > 0 ";*/
    }
    // q += "GROUP BY ShiftId";
    return DB.query(q, data).then(function (res) { return DB.fetchAll(res); });
  };

  /*Yi Yi Po*/
  /*--*/


  var getItemDetails = function (type, shiftId, businessDate) {
    var q = 'SELECT ' +
      'COUNT(*) AS ItemCount, ' +
      'SUM(d.SubTotal) AS SubTotal, ' +
      'SUM(d.DiscAmount) AS DiscAmount, ' +
      'SUM(d.Tax1Amount) AS Tax1Amount, ' +
      'SUM(d.Tax2Amount) AS Tax2Amount, ' +
      'SUM(d.Tax3Amount) AS Tax3Amount, ' +
      'SUM(d.Tax4Amount) AS Tax4Amount, ' +
      'SUM(d.Tax5Amount) AS Tax5Amount, ' +
      'SUM(d.Tax1DiscAmount) AS Tax1DiscAmount, ' +
      'SUM(d.Tax2DiscAmount) AS Tax2DiscAmount, ' +
      'SUM(d.Tax3DiscAmount) AS Tax3DiscAmount, ' +
      'SUM(d.Tax4DiscAmount) AS Tax4DiscAmount, ' +
      'SUM(d.Tax5DiscAmount) AS Tax5DiscAmount ' +
      'FROM BillDetail AS d INNER JOIN BillHeader AS h ON d.DocNo = h.DocNo WHERE  h.BusinessDate=? ';
    switch (type) {
      case 'reverse':
        //q += "AND RefCode NOT NULL ";
        q += 'AND Qty < 0 AND ReasonId!=0 AND h.VoidDocNo=\'\' AND DocType!=\'AV\' ';
        break;
    }
    var data = [businessDate];

    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    // q += "GROUP BY ShiftId";
    return DB.query(q, data).then(function (res) { return DB.fetchAll(res); });
  };

  var getReceiptCount = function (shiftId, bDate) {
    var q = 'SELECT  COUNT(*) AS ItemCount FROM BillHeader WHERE BusinessDate=? AND DocType = \'SA\' OR DocType = \'VD\' ';
    var data = [bDate];
    if (shiftId) {
      q += ' AND ShiftId = ?';
      data.push(shiftId);
    }
    // q += " GROUP BY ShiftId";
    return DB.query(q, data).then(function (res) { return DB.fetch(res); });
  };

  var getVoidItemDetails = function (shiftId, businessDate) {
    var q = 'SELECT ' +
      'COUNT(*) AS ItemCount, ' +
      'SUM(d.SubTotal) AS SubTotal, ' +
      'SUM(d.DiscAmount) AS DiscAmount ' +
      'FROM VoidItems AS d WHERE  BusinessDate=? ';
    var data = [businessDate];

    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    // q += "GROUP BY ShiftId";
    return DB.query(q, data).then(function (res) { return DB.fetchAll(res); });
  };

  self.getHeaderDetails = function (shiftId, businessDate) {
    return $q.all({
      sales: getHeaderDetailsForMode(shiftId, '\'SA\', \'VD\'', null, businessDate),
      void: getHeaderDetailsForMode(shiftId, '\'VD\'', null, businessDate),
      abort: getHeaderDetailsForMode(shiftId, '\'AV\'', null, businessDate),
      float: getHeaderDetailsForMode(shiftId, '\'RA\'', null, businessDate),
      // float: getHeaderDetailsForMode(shiftId, '\'RA\'', null, businessDate),
      payout: getHeaderDetailsForMode(shiftId, '\'PO\'', null, businessDate),
      receiveIn: getHeaderDetailsForMode(shiftId, '\'RI\'', null, businessDate),
      cashDeclared: getHeaderDetailsForMode(shiftId, '\'CD\'', null, businessDate),
      reverse: getItemDetails('reverse', shiftId, businessDate),
      itemVoid: getVoidItemDetails(shiftId, businessDate),
      discounted: getHeaderDetailsForMode(shiftId, null, true, businessDate),
      voiddiscounted: getHeaderDetailsForMode(shiftId, '\'VD\'', true, businessDate),
      recCount: getReceiptCount(businessDate)
    }).then(function (data) {
      data.sales = ItemService.calculateTotal(_.first(data.sales));
      data.discounted = ItemService.calculateTotal(_.first(data.discounted));
      data.voiddiscounted = ItemService.calculateTotal(_.first(data.voiddiscounted));
      data.refund = ItemService.calculateTotal(_.first(data.refund));
      data.float = ItemService.calculateTotal(_.first(data.float));
      data.payout = ItemService.calculateTotal(_.first(data.payout));
      data.void = ItemService.calculateTotalWithNoDisc(_.first(data.void));
      //data.void = ItemService.calculateTotal(_.first(data.void));
      //data.abort = ItemService.calculateTotal(_.first(data.abort));
      data.abort = ItemService.calculateTotalWithNoDisc(_.first(data.abort));
      data.receiveIn = ItemService.calculateTotal(_.first(data.receiveIn));
      data.cashDeclared = ItemService.calculateTotal(_.first(data.cashDeclared));
      data.reverse = ItemService.calculateTotal(_.first(data.reverse));
      //data.itemVoid = ItemService.calculateTotal(_.first(data.itemVoid));
      data.itemVoid = ItemService.calculateTotalWithNoDisc(_.first(data.itemVoid));

      return data;
    });
  };

  var getTransDetailsForMode = function (shiftId, cash, rounded, bDate) {
    var q = 'SELECT COUNT(*) AS ItemCount, SUM(Amount) AS Amount, SUM(ChangeAmount) AS ChangeAmount FROM PayTrans AS p INNER JOIN BillHeader AS h ON p.DocNo = h.DocNo WHERE h.BusinessDate=? AND Cash = ? AND DocType != \'CD\'';
    var data = [bDate, cash];
    // +"WHERE DocType = 'SA'  AND h.VoidDocNo='' "
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    if (rounded) {
      q += 'AND PayTypeId = -1 ';
    } else {
      q += 'AND PayTypeId > 0 ';
    }
    // q += "GROUP BY ShiftId";
    return DB.query(q, data).then(function (res) { return DB.fetchAll(res); });
  };

  var getVoidTransDetailsForMode = function (shiftId, cash, rounded, bDate) {
    var q = 'SELECT COUNT(*) AS ItemCount, SUM(Amount) AS Amount, SUM(ChangeAmount) AS ChangeAmount FROM PayTrans AS p INNER JOIN BillHeader AS h ON p.DocNo = h.DocNo WHERE h.BusinessDate=? AND Cash = ? AND DocType != \'CD\' AND DocType = \'VD\' ';
    var data = [bDate, cash];
    // +"WHERE DocType = 'SA' "
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    if (rounded) {
      q += 'AND PayTypeId = -1 ';
    } else {
      q += 'AND PayTypeId > 0 ';
    }
    // q += "GROUP BY ShiftId";
    return DB.query(q, data).then(function (res) { return DB.fetchAll(res); });
  };


  self.getTransDetails = function (shiftId, bDate) {
    return $q.all({
      cash: getTransDetailsForMode(shiftId, 'true', null, bDate),
      nonCash: getTransDetailsForMode(shiftId, 'false', null, bDate),
      rounded: getTransDetailsForMode(shiftId, 'false', true, bDate),
      voidrounded: getVoidTransDetailsForMode(shiftId, 'false', true, bDate)
    }).then(function (data) {
      data.cash = _.first(data.cash);
      data.nonCash = _.first(data.nonCash);
      data.rounded = _.first(data.rounded);

      return data;
    });
  };

  self.getTransactionAmounts = function (bDate, shiftId) {
    var q = 'SELECT COUNT(*) AS ItemCount, SUM(Amount), Cash FROM PayTrans AS p INNER JOIN BillHeader AS h ON p.DocNo = h.DocNo WHERE h.BusinessDate = ? AND DocType != \'CD\' AND DocType != \'RA\'';
    var data = [bDate];
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    q += ' GROUP BY Cash';
    return DB.query(q, data).then(function (res) {
      var data = DB.fetchAll(res);
      var trans = {};
      _.forEach(data, function (row) {
        if (row) {
          if (row.Cash == 'true') {
            trans.cash = _.omit(row, 'Cash');
          } else if (row.Cash == 'false') {
            trans.nonCash = _.omit(row, 'Cash');
          }
        }
      });
      return trans;
    });
  };

  self.getTransactionBreakdown = function (bDate, shiftId) {
    var q = 'SELECT SUM(p.Amount) AS Amount, SUM(p.ChangeAmount) AS ChangeAmount, COUNT(*) AS Count, t.Description1, t.Description2, p.Cash,t.Id FROM PayTrans AS p ' +
    'INNER JOIN BillHeader AS h ON p.DocNo = h.DocNo ' +
    'INNER JOIN TenderTypes AS t on p.PayTypeId = t.Id ' + 'WHERE h.BusinessDate = ? AND DocType != \'CD\' AND DocType != \'RA\'';
    var data = [bDate];
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    q += 'GROUP BY t.Id';
    return DB.query(q, data).then(function (res) {
      var data = DB.fetchAll(res);
      var trans = {
        cash: [],
        nonCash: []
      };
      _.forEach(data, function (row) {
        if (row) {
          if (row.Cash == 'true') {
            trans.cash.push(_.omit(row, 'Cash'));
          } else if (row.Cash == 'false') {
            trans.nonCash.push(_.omit(row, 'Cash'));
          }
        }
      });
      return trans;
    });
  };

  self.getVoidTransactionBreakdown = function (bDate, shiftId) {
    var q = 'SELECT SUM(p.Amount) AS Amount, SUM(p.ChangeAmount) AS ChangeAmount, COUNT(*) AS Count, t.Description1, t.Description2, p.Cash,t.Id FROM PayTrans AS p ' +
    'INNER JOIN BillHeader AS h ON p.DocNo = h.DocNo ' +
    'INNER JOIN TenderTypes AS t on p.PayTypeId = t.Id ' + 'WHERE h.BusinessDate = ? AND DocType = \'VD\'';
    var data = [bDate];
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    q += 'GROUP BY t.Id';
    return DB.query(q, data).then(function (res) {
      var data = DB.fetchAll(res);
      var transcount = [];
      _.forEach(data, function (row) {
        if (row) {
          transcount[row.Id] = row.Count;
        }
      });
      return transcount;
    });
  };

  self.getGst = function (bDate, shiftId) {
    var q = 'SELECT SUM(Tax5Amount) AS Tax5Amount, SUM(Tax5DiscAmount) AS Tax5DiscAmount, COUNT(*) AS ItemCount FROM BillHeader WHERE BusinessDate = ? AND DocType != \'CD\' AND DocType != \'RA\' AND DocType != \'AV\' ';
    var data = [bDate];
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    return DB.query(q, data).then(function (res) {
      return DB.fetch(res);
    });
  };

  self.getOverTenderBreakdown = function (bDate, shiftId) {
    var q = 'SELECT OverTenderTypeId, SUM(Amount) AS Amount, COUNT(*) AS Count,OverTenderTypeId FROM PayTransOverTender AS p ' +
      'INNER JOIN BillHeader AS h ON p.DocNo = h.DocNo ' +
      'WHERE h.BusinessDate = ? AND OverTenderTypeId != 3 ';
    var data = [bDate];
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    q += 'GROUP BY OverTenderTypeId';
    return DB.query(q, data).then(function (res) {
      return DB.fetchAll(res);
    });
  };
  self.getVoidOverTenderBreakdown = function (bDate, shiftId) {
    var q = 'SELECT OverTenderTypeId, SUM(Amount) AS Amount, COUNT(*) AS Count,OverTenderTypeId FROM PayTransOverTender AS p ' +
      'INNER JOIN BillHeader AS h ON p.DocNo = h.DocNo ' +
      'WHERE h.BusinessDate = ? AND OverTenderTypeId != 3 AND h.DocType=\'VD\'';
    var data = [bDate];
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      q += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    q += 'GROUP BY OverTenderTypeId';
    return DB.query(q, data).then(function (res) {
      var data = DB.fetchAll(res);
      var overtranscount = [];
      _.forEach(data, function (row) {
        if (row) {
          overtranscount[row.OverTenderTypeId] = row.Count;
        }
      });
      return overtranscount;
      //return DB.fetchAll(res);
    });
  };

  self.getReceiptCount = function (bDate, shiftId) {
    var data = [bDate];
    var columns = 'BusinessDate = ? ';
    if (_.isUndefined(shiftId) || _.isNull(shiftId)) { } else {
      columns += 'AND ShiftId = ? ';
      data.push(shiftId);
    }
    return DB.select(DB_CONFIG.tableNames.bill.header, 'COUNT(*) AS ItemCount', { columns: columns, data: data }).then(function (res) {
      var data = DB.fetch(res);
      return data.ItemCount || 0;
    });
  };


  return self;
}]);
