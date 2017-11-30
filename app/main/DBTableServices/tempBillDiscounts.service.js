/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory('TempBillDiscountsService', ['LocationService', 'ControlService', '$localStorage', 'ErrorService', 'DB', 'DB_CONFIG', 'TenderService', 'SettingsService', '$filter', 'AuthService', '$q', 'ShiftService',
    function (LocationService, ControlService, $localStorage, ErrorService, DB, DB_CONFIG, TenderService, SettingsService, $filter, AuthService, $q, ShiftService) {
      var self = this;
      self.table = DB_CONFIG.tableNames.discounts.tempBillDiscounts;


      var columnList = ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'LineNumber', 'SeqNo', 'DiscountFrom', 'DiscountId', 'DiscountCode', 'DiscountFor', 'DiscountType', 'DiscountAmount', 'DiscountPercentage'];


      var getSeqNo = function (itemId, lineNumber) {
        return DB.max(self.table, 'SeqNo', { columns: 'ItemId = ? AND LineNumber = ?', data: [itemId, lineNumber] }).then(function (ln) {
          return ++ln;
        });
      };

      /**
       * Validates the bill object with property names in required array and returns an errors array
       * @param bill
       * @returns {Array}
       */
      self.validate = function (item) {
        var required = columnList;
        var errors = [];
        if (item) {
          angular.forEach(required, function (attribute) {
            if (_.isUndefined(item[attribute]) || item[attribute] == null) {
              errors.push('Field ' + attribute + ' cannot be empty');
            }
          });
        } else {
          errors.push('Discount Item not found');
        }

        return errors;
      };

      self.insert = function (item, addInsertToQueue) {
        return getSeqNo(item.ItemId, item.LineNumber).then(function (seqNo) {
          item.SeqNo = seqNo;
          item = _.pick(item, columnList);
          var errors = self.validate(item);
          if (errors.length == 0) {
            if (addInsertToQueue) {
              return $q.when(DB.addInsertToQueue(self.table, item));
            } else {
              return DB.insert(self.table, item);
            }
          } else {
            return $q.reject('Unable to save to DB ' + errors.join(', '));
          }
        });
      };


      self.delete = function (where, addInsertToQueue) {
        if (where && where.columns && where.data) {
          if (addInsertToQueue) {
            DB.addDeleteToQueue(self.table, where);
            return $q.when(true);
          } else {
            return DB.delete(self.table, where);
          }
        } else {
          return $q.reject('Invalid where value');
        }
      };

      return self;
    }
  ]);
