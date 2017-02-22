/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory("ModifierService", ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG) {
    var self = this;

    self.TYPE_FOOD = 'F';
    self.TYPE_DRINK = 'B';

    self.fetch = function () {
      var deferred = $q.defer();
      try {
        Restangular.one("GetModifiersKeyInfo").get({EntityId: SettingsService.getEntityId()}).then(function (res) {
          try {
            var items = JSON.parse(res);
          } catch(ex){
            deferred.reject("No results");
          }
          if (items) {
            self.save(items);
            deferred.resolve(items);
          } else {
            deferred.reject('Unknown machine');
          }
        }, function (err) {
          console.error(err);
          deferred.reject('Unable to fetch data from the server');
        });
      } catch (ex) {
        deferred.reject(ex);
      }

      return deferred.promise;
    }

    self.get = function(type) {
      var deferred = $q.defer();
      var q = "SELECT DISTINCT i.Description1, i.Description1, Modifier, d.ModifierType, i.Plu, m.KeyNo, m.PageNo FROM ModifiersKeyInfo AS m "
        +"INNER JOIN Item AS i ON m.PLU = i.Plu "
        +"INNER JOIN Departments AS d ON d.Id = i.DepartmentId "
        +"WHERE ModifierType = ? AND Modifier = 'true'"
      DB.query(q, [type||'F']).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        deferred.reject(err.message);
      });
      return deferred.promise;
    }

    self.getSubPlu = function(plu, page, key) {
      var deferred = $q.defer();
      var q = "SELECT s.*, i.Id AS ItemId, m.* FROM ModifiersKeyInfo AS m "

      +"INNER JOIN Item AS i ON m.PLU = i.Plu "
      +"INNER JOIN SubPLU1 AS s ON i.SubPlu1Id = s.Id "

      +"WHERE i.Plu = ? AND PageNo = ? AND KeyNo = ? "
      // +"ORDER BY PageNo, KeyNo "
      +"GROUP BY s.Id"
      DB.query(q, [plu, page, key]).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        deferred.reject(err.message);
      });
      return deferred.promise;
    }

    self.save = function (items) {
      DB.addInsertToQueue(DB_CONFIG.tableNames.item.modifiers, items);
    }

    self.getItemModifiers = function(parentLineNumber){
      return DB.select(DB_CONFIG.tableNames.bill.tempDetail, '*', { columns: "ParentItemLineNumber = ? AND ItemType = 'MOD'", data: [parentLineNumber] }).then(function(res){
        return DB.fetchAll(res);
      });
    }


    return self;
  }]);
