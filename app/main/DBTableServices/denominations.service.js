/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory("DenominationsService", ['DB', 'DB_CONFIG',
    function (DB, DB_CONFIG) {
      var self = this;
      self.table = DB_CONFIG.tableNames.bill.denominations;

      self.getAll = function(){
        return DB.select(self.table, '*').then(function (res) {
          return DB.fetchAll(res);
        });
      }

      self.insert = function(item){
        return DB.insert(self.table, item);
      }


      self.delete = function (where) {
         DB.delete(self.table, where);
      }

      return self;
    }
  ]);
