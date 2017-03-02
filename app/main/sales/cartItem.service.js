/**
 * Created by shalitha on 27/5/16.
 */
angular.module('itouch.services')
  .factory("CartItemService", ['Restangular', 'AuthService', 'TaxService', 'BillService', 'SalesKitService', '$q', 'ItemService', 'DB', 'DB_CONFIG',
    function (Restangular, AuthService, TaxService, BillService, SalesKitService, $q, ItemService, DB, DB_CONFIG) {
      var self = this;
      var cart = {
        summery: {},
        items: {}
      };


      self.refreshCartSummery = function (header) {
        if(header){
          cart.summery = header;
        }
        cart.summery.SubTotal = 0;
        cart.summery.Discount = 0;
        cart.summery.Count = 0;
        cart.summery.Tax = 0;
        cart.summery.Total = 0;
        cart.summery.DiscAmount = 0;
        cart.summery.Tax1Amount = 0;
        cart.summery.Tax2Amount = 0;
        cart.summery.Tax3Amount = 0;
        cart.summery.Tax4Amount = 0;
        cart.summery.Tax5Amount = 0;
        cart.summery.Tax1DiscAmount = 0;
        cart.summery.Tax2DiscAmount = 0;
        cart.summery.Tax3DiscAmount = 0;
        cart.summery.Tax4DiscAmount = 0;
        cart.summery.Tax5DiscAmount = 0;

        if (!_.isEmpty(cart.items)) {
          angular.forEach(cart.items, function (item) {
            cart.summery.SubTotal += item.SubTotal;
            cart.summery.Count += parseInt(item.Qty) || 0;
            cart.summery.Tax1Amount += item.Tax1Amount || 0;
            cart.summery.Tax2Amount += item.Tax2Amount || 0;
            cart.summery.Tax3Amount += item.Tax3Amount || 0;
            cart.summery.Tax4Amount += item.Tax4Amount || 0;
            cart.summery.Tax5Amount += item.Tax5Amount || 0;
            cart.summery.DiscAmount += item.DiscAmount || 0;
            cart.summery.Tax1DiscAmount += item.Tax1DiscAmount || 0;
            cart.summery.Tax2DiscAmount += item.Tax2DiscAmount || 0;
            cart.summery.Tax3DiscAmount += item.Tax3DiscAmount || 0;
            cart.summery.Tax4DiscAmount += item.Tax4DiscAmount || 0;
            cart.summery.Tax5DiscAmount += item.Tax5DiscAmount || 0;
            cart.summery.Tax += item.Tax || 0;
            cart.summery.Total += item.Total || 0;
            cart.summery.Discount += item.Discount || 0;
          });
          cart.summery.SubTotal = cart.summery.SubTotal.roundTo(2);
          cart.summery.Count = cart.summery.Count.roundTo(2);
          cart.summery.Tax1Amount = cart.summery.Tax1Amount.roundTo(2);
          cart.summery.Tax2Amount = cart.summery.Tax2Amount.roundTo(2);
          cart.summery.Tax3Amount = cart.summery.Tax3Amount.roundTo(2);
          cart.summery.Tax4Amount = cart.summery.Tax4Amount.roundTo(2);
          cart.summery.Tax5Amount = cart.summery.Tax5Amount.roundTo(2);
          cart.summery.DiscAmount = cart.summery.DiscAmount.roundTo(2);
          cart.summery.Tax1DiscAmount = cart.summery.Tax1DiscAmount.roundTo(2);
          cart.summery.Tax2DiscAmount = cart.summery.Tax2DiscAmount.roundTo(2);
          cart.summery.Tax3DiscAmount = cart.summery.Tax3DiscAmount.roundTo(2);
          cart.summery.Tax4DiscAmount = cart.summery.Tax4DiscAmount.roundTo(2);
          cart.summery.Tax5DiscAmount = cart.summery.Tax5DiscAmount.roundTo(2);
          cart.summery.Tax = (cart.summery.Tax - cart.summery.Tax5DiscAmount).roundTo(2);
          cart.summery.Total = cart.summery.Total.roundTo(2);
          cart.summery.Discount = cart.summery.Discount.roundTo(2);

        }
      };

      self.refreshCart = function () {
        self.refreshCartSummery();
        // self.getItems();
      }
      self.refreshCart();

      self.getItems = function () {
        var def = $q.defer();
        if (!_.isEmpty(cart.items)) {
          def.resolve(cart.items);
        } else {
          return self.fetchItemsFromDb();
        }
        return def.promise;
      }

      self.fetchItemsFromDb = function (docNo) {
        return BillService.getItems(docNo).then(function (items) {
          cart.items = {};
          if (items && items.length > 0) {
            angular.forEach(items, function (item) {
              item  = ItemService.calculateTotal(item);
              if (item.DiscAmount > 0 || item.ItemType == 'SKI' || item.ItemType == 'SKT') {
                self.setDiscountedItem(item.ItemId, item.ItemType, item, item.LineNumber);
              } else {
                // if(item.ReasonId){
                  self.setItem(item.ItemId, item.ItemType, item, item.LineNumber, item.ReasonId != null, item.ParentItemLineNumber);
                // } else {

                // }
              }
            });
          }

          self.refreshCartSummery();
          return cart.items;
        }, function (ex) {
          console.log(ex);
        });
      }

      self.getSummery = function (header) {
        self.refreshCartSummery(header);
        return cart.summery;
      }

      self.addItemToCart = function (item, salesKit) {

        item = angular.copy(item);
        var cartItem = null;
        if(item){
          cartItem = self.findItem(item.Id, item.ItemType, item.LineNumber, item.parentItemLineNumber);
        }

        return BillService.findItems(item.ItemId, item.ItemType, item.parentItemLineNumber).then(function (items) {
          var ndItem = getItem(items);
          if(item.OpenKey){
            if(item.customQuantity){
              item.Qty = item.customQuantity;
            }
            if(!item.Qty){
              item.Qty = 1;
            }

            return BillService.addItem(item);

          } else if (ndItem && !salesKit && ndItem.TakeAway == 'false' && ndItem.ChildCount == 0) {
            if(item.customQuantity){
              ndItem.Qty += item.customQuantity;
            } else {
              ndItem.Qty++;
            }
            return BillService.updateItem(ndItem);
          } else {
            if(item.customQuantity){
              item.Qty = item.customQuantity;
            }
            if(!item.Qty){
              item.Qty = 1;
            }

            return BillService.addItem(item);
          }
        });


      }

      self.addSalesKitItemToCart = function(item){
        var item = angular.copy(item);

        return BillService.addSalesKitItem(item).then(function () {
          self.refreshCart();
          return item;
        }).catch(function (ex) {
          console.log(ex);
        });
      }

      self.updateSalesKitItem = function (item, itemId) {

        item = angular.copy(item);
        var cartItem = self.findItem(item.Id, item.ItemType, item.LineNumber);
        var omitList = ['$$hashKey', 'Default', 'SalesKitId', 'Priority', 'PLU_Description1', 'PLU_Description2', 'KitchenId',
          'SubPlu1Id', 'SubPlu2Id', 'SubPlu3Id', 'DepartmentId', 'UOM_Id', 'HouseBarCode', 'selected', 'AddedAt', 'key', 'list',
          'selectedList', 'Quantity', 'PopUpRemark', 'Selected', 'SalesKitItemsId', 'SelectionId', 'AdditionalPrice', 'AdditionalCost',
          'Sequence'];
        item = _.omit(item, omitList);
        return BillService.updateSalesKitItem(item, itemId).then(function () {
          self.refreshCart();
          return item;
        }).catch(function (ex) {
          console.log(ex);
        });


      }

      var getItem = function (items) {
        var nDI = false;
        angular.forEach(items, function (item) {
          if (item.DiscAmount == 0 && !item.ReasonId) {
            nDI = item;
          }
        });

        return nDI;
      }

      self.addPWP = function(parentItem, items){
        return BillService.loadLineNewNumber().then(function(lineNumber){

          var promises = [];
          parentItem.LineNumber = lineNumber;
          promises.push(self.addItemToCart(parentItem));
          items = _.map(items, function(item){
            item.ParentItemLineNumber = parentItem.LineNumber;
            lineNumber += 100;
            item.LineNumber = lineNumber;
            promises.push(self.addItemToCart(item));
            return item;
          });
          return $q.all(promises);
        });
      }

      self.clearCart = function () {
        cart = {
          summery: {},
          items: {}
        };
        self.refreshCartSummery();
      }

      self.findItem = function (id, type, lineNumber, parentItemLineNumber) {
        if (id && type && type == 'NOR') {

          var label = id + type;
          if (lineNumber) {
            label += lineNumber;
          }
          if(parentItemLineNumber){
            label += parentItemLineNumber;
          }
          var item = cart.items[label];
          if(!item || item.ParentItemLineNumber != 0){
            return null;
          }
          return item;
        } else {
          return null;
        }
      }
      var counter = 1;
      self.setItem = function (id, type, item, lineNumber, refunded, parentItemLineNumber) {
        if (id && type && item) {
          var label = "";
          if(refunded){
            label += "REFUND-";
          }

          if(item.TakeAway == 'true'){
            label += 'TA-';
            label += counter++;
          }

          label += id + type;

          if (lineNumber) {
            label += lineNumber;
          }
          if(parentItemLineNumber){
            label += parentItemLineNumber;
          }
          if(type == 'PWP' || type == 'PWI'){
            label += counter++;
          }
          if(item.OpenKey){
            label += 'OK'+(counter++);
          }
          cart.items[label] = item;
        }

      }

      self.setDiscountedItem = function (id, type, item, lineNumber) {
        if (id && type && item && lineNumber) {
          var label = id + type;

          delete cart.items[label];
          // if(lineNumber){
          label += 'D' + lineNumber;
          // }
          cart.items[label] = item;
        }
      }

      self.findSalesKitParent = function (parentId) {
        return self.fetchItemsFromDb().then(function (items) {
          var sk = _.findWhere(items, {LineNumber: parentId});
          if(sk){
            return sk;
          } else {
            return $q.reject("not found");
          }
        })
      }

      self.isEmpty = function(){
        return DB.query("SELECT COUNT(*) AS c FROM "+DB_CONFIG.tableNames.bill.tempDetail).then(function(res){
          var count = DB.fetch(res).c;
          if(count == 0){
            return true;
          } else {
            return false;
          }
        });
      }

      self.getChildItems = function(parentItemLineNumber){
        return DB.query("SELECT * FROM "+DB_CONFIG.tableNames.bill.tempDetail +" WHERE ParentItemLineNumber = ?", [parentItemLineNumber]).then(function(res){
          return DB.fetchAll(res);
        });
      }


      return self;
    }]);
