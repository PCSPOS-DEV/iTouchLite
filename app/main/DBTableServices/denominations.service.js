/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
  .factory("DenominationsService", ['DB', 'DB_CONFIG', '$q',
    function (DB, DB_CONFIG, $q) {
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

      self.addDefault = function(){
        var arr = [2, 5, 10, 50, 100];
        var prom = [];
        angular.forEach(arr, function (item) {
          prom.push(self.insert({ Desc: item.toFixed(2), Value: item }));
        });
        return $q.all(prom);
      }

      return self;
    }
  ]);
