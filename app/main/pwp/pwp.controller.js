/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('PWPCtrl', ['$scope', 'ControlService', '$ionicPopup', 'CartItemService', 'BillService', '$log', 'ItemService', '$q', 'DiscountService', 'Alert',
    function ($scope, ControlService, $ionicPopup, CartItemService, BillService, $log, ItemService, $q, DiscountService, Alert) {

      $scope.title = "PWP";
      $scope.selectedRow = null;
      var selectedItem = null;

      $scope.$on("modal.shown", function(){
        if($scope.shownModal == 'pwp'){
          $scope.pwp.selectedItems = {};
        }
      });

      var checkQuantities = function(pwp){
        var times = Math.floor(pwp.QtyEntered / pwp.Quantity);
        // console.log(times);
        pwp.MaxQuantity = pwp.MaxQuantity * times;
        return pwp;
      }

      $scope.selectItem = function (item) {
        // console.log(item);
        // if(!$scope.pwp.Qty){
        //   $scope.pwp.Qty = 0;
        // }
        // if($scope.pwp.Qty && $scope.pwp.TotalChildQty <= $scope.pwp.Qty){
        //   return true;
        // }
        // if($scope.pwp.selectedItems){
        //   var exItem = $scope.pwp.selectedItems[item.SubItemId];
        //   if(exItem){
        //     item = exItem;
        //     item.Qty++;
        //     $scope.pwp.Qty++;
        //     $scope.pwp.selectedItems[item.SubItemId] = item;
        //   } else {
        //     addPrice(item).then(function(item){
        //       item.Qty = 1;
        //       $scope.pwp.Qty++;
        //       $scope.pwp.selectedItems[item.SubItemId] = item;
        //     });
        //
        //   }
        //
        // } else {
        //   item.Qty = 1;
        //   addPrice(item).then(function(item){
        //     item.MaxQuantity--;
        //     $scope.pwp.Qty++;
        //     // $scope.pwp.MaxQuantity--;
        //     $scope.pwp.selectedItems = {};
        //     $scope.pwp.selectedItems[item.SubItemId] = item;
        //
        //   });
        //
        // }
        addItem(item);
        $scope.selectRow(item);
      }

      var addPrice = function(item){
        return ItemService.getPrice(item.Plu, parseInt(item.PriceGroupId)).then(function (data) {
          item.Price = data ? data.Price : 0;
          item.OrgPrice = data ? data.OrgPrice : 0;
          item.AlteredPrice = data ? data.AlteredPrice : 0;
          item.StdCost = data ? data.StdCost : 0;
          item.PriceLevelId  = data ? data.PriceLevelId : 0;
          return item;
        });
      }

      $scope.selectRow = function (item) {
        $scope.pwp.selectedItems = _.mapObject($scope.pwp.selectedItems, function (value, key) {
          value.selected = false;
          return value;
        });
        $scope.selectedRow = item;
        item.selected = true;
      }

      $scope.addSelected = function () {
        addItem($scope.selectedRow);
      }

      var addItem = function (item) {
        if (item) {
          if($scope.pwp.Qty && $scope.pwp.TotalChildQty <= $scope.pwp.Qty){
              Alert.warning("You have selected the maximum children allowed for this PWP.");
              return true;
            }
          var exItem = _.findWhere($scope.pwp.selectedItems, { SubItemId: item.SubItemId});
          if (exItem) {
            if (exItem && item.SubItemMaxQty > exItem.Qty) {
              item.Qty++;
              $scope.pwp.Qty++;
            } else {
              return false;
            }
          } else {
            item.Qty = 1;
            addPrice(item).then(function(item){
              // item.MaxQuantity--;
              $scope.pwp.Qty++;
              // $scope.pwp.MaxQuantity--;
              $scope.pwp.selectedItems[item.SubItemId] = item;

            });
          }
        }
      }

      $scope.removeSelected = function () {
        if ($scope.selectedRow && $scope.selectedRow.Qty > 0) {
          $scope.selectedRow.Qty--;
          $scope.pwp.Qty--;
          if ($scope.selectedRow.Qty == 0) {
            $scope.clearSelected();
          }
        }
      }

      $scope.clearSelected = function () {
        if ($scope.selectedRow && $scope.selectedRow.Default != true) {
          removeSelectedItem($scope.selectedRow.SubItemId);
        }
      }

      $scope.clearAll = function () {
        angular.forEach($scope.pwp.selectedItems, function (item, key) {
          if (item) {
            removeSelectedItem(key);
          }
        })
      }

      var removeSelectedItem = function (itemId) {
        var item = $scope.pwp.selectedItems[itemId]
        if (item) {
          item.Qty = 0;
          $scope.pwp.Qty -= item.Qty;
          delete $scope.pwp.selectedItems[itemId];
          var keys = _.keys($scope.pwp.selectedItems);
          if(keys.length > 0){
            $scope.selectRow($scope.pwp.selectedItems[_.last(keys)]);
          }
        }
      };

      $scope.save = function () {
        if (!_.isEmpty($scope.pwp.selectedItems)) {
          var items = {};
          angular.forEach($scope.pwp.selectedItems, function(i){
            items[i.SubItemId] = ItemService.getById(i.SubItemId);
          });
          $q.all(items).then(function(data){
            // console.log(data);
            var promises  = [];
            $scope.pwp.item.ItemId = $scope.pwp.item.Id;
            $scope.pwp.item.ItemType = 'PWP';
            promises.push(CartItemService.addItemToCart($scope.pwp.item));
            promises.concat(_.map(data, function(item, key){
              var exItem = $scope.pwp.selectedItems[key];
              if(exItem){
                if(exItem.DiscountId) {
                  // console.log(exItem);
                  DiscountService.getDiscountById(exItem.DiscountId).then(function(dis){
                    // console.log(dis);
                    // DiscountService.saveTempDiscountItem(item, dis).then(function (item) {
                    //   // $scope.cart.selectedItem.discounted = true;
                    //   // console.log(item);
                    //   // CartItemService.setDiscountedItem(item.ItemId, item.ItemType, item, item.LineNumber);
                    //   $scope.$emit("refresh-cart");
                    //   $scope.$emit("discountModel-close");
                    // }, function () {
                    //   $scope.$emit("discountModel-close");
                    // });
                  });
                } else if(exItem && exItem.Price){
                  item.Price = exItem.Price;
                }
                item.Qty = exItem.Qty;
                // renameProperty(item, 'SubItemId', 'ItemId');
                item.ItemId = item.Id;
                item.ItemType = 'PWI';
                item.ParentItemLineNumber = $scope.pwp.item.ItemId;
                return CartItemService.addItemToCart(item);
              }
              // return item;
            }));
            // console.log(promises);
            $q.all(promises).then(function(data){
              // console.log(data);
              $scope.$emit('refresh-cart');
              $scope.$emit('pwpModal-close');
            }, function(errors){
              console.log(errors);
            });

            // console.log(data);
          });

          // operation.then(function () {
          //   selectedItem = null;
          //   $scope.$emit('refresh-cart');
          //   $scope.$emit('skModalModal-save');
          //   $scope.selectItem(item);
          // }).catch(function (err) {
          //   console.log(err);
          // });
        } else {
          $ionicPopup.alert({
            title: 'None Selected!',
            template: 'Please select an item to proceed.'
          });
        }


      }

      $scope.close = function () {
        $scope.$emit('pwpModal-close');
      }

    }]);
