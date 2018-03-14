/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('PWPCtrl', ['$scope', 'ControlService', '$ionicPopup', 'CartItemService', 'BillService', '$log', 'ItemService', '$q', 'DiscountService', 'Alert', '$timeout',
    function ($scope, ControlService, $ionicPopup, CartItemService, BillService, $log, ItemService, $q, DiscountService, Alert, $timeout) {

      $scope.title = 'PWP';
      $scope.selectedRow = null;
      //var selectedItem = null;
      var submitted = false;
      $scope.tempSubTotal = 0;
      var temp = 0;
      SubItemTotalPrice = 0;

      $scope.$on('modal.shown', function () {
        if ($scope.shownModal == 'pwp') {
          submitted = false;
          $scope.pwp.selectedItems = {};
        }
      });

      var checkQuantities = function (pwp) {
        var times = Math.floor(pwp.QtyEntered / pwp.Quantity);
        console.log('times : ' + times);
        pwp.MaxQuantity = pwp.MaxQuantity * times;
        return pwp;
      };

      $scope.selectItem = function (item) {
        addItem(item);
        $scope.selectRow(item);
      };

      var addPrice = function (item) {
        return ItemService.getPrice(item.Plu, parseInt(item.PriceGroupId)).then(function (data) {
          item.Price = data ? data.Price : 0;
          item.OrgPrice = data ? data.OrgPrice : 0;
          item.AlteredPrice = data ? data.AlteredPrice : 0;
          item.StdCost = data ? data.StdCost : 0;
          item.PriceLevelId  = data ? data.PriceLevelId : 0;
          return item;
        });
      };

      $scope.selectRow = function (item) {
        $scope.pwp.selectedItems = _.mapObject($scope.pwp.selectedItems, function (value, key) {
          value.selected = false;
          return value;
        });
        if (item) {
          item.selected = true;
        }
        $scope.selectedRow = item;
      };

      $scope.addSelected = function () {
        addItem($scope.selectedRow);
      };

      var addItem = function (item) {
        if (item) {
          $timeout(function () {
            temp += item.Price;
            if (temp <= $scope.pwp.MaxPrice || $scope.pwp.MaxPrice == 0) {
              $scope.tempSubTotal = temp;
              SubItemTotalPrice = $scope.selectedRow.Qty * $scope.selectedRow.SubItemPrice;
            } else {
              Alert.warning('The child total price excced the limit of maximum price.');
              console.log($scope.selectedRow);
              $scope.selectedRow.Qty--;
              $scope.pwp.Qty--;
              temp -= $scope.selectedRow.Price;
              if ($scope.selectedRow.Qty == 0) {
                $scope.clearSelected(true);
              }
              // $scope.removeSelected();
              return true;
            }
          }, 200);
          if ($scope.pwp.Qty && $scope.pwp.TotalChildQty <= $scope.pwp.Qty) {
            Alert.warning('You have selected the maximum children allowed for this PWP.');
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
            var promise;
            if (item.SubItemPrice >= 0) {
              item.Price = item.SubItemPrice;
              item.OrgPrice = item.SubItemPrice;
              item.AlteredPrice = item.SubItemPrice;
              promise = $q.when(item);
            } else {
              promise = addPrice(item);
            }
            promise.then(function (item) {
              // item.MaxQuantity--;
              $scope.pwp.Qty++;
              // $scope.pwp.MaxQuantity--;
              $scope.pwp.selectedItems[item.SubItemId] = item;

            });
          }
        }
      };

      $scope.removeSelected = function () {
        if ($scope.selectedRow && $scope.selectedRow.Qty > 0) {
          $scope.selectedRow.Qty--;
          $scope.pwp.Qty--;
          $scope.tempSubTotal -= $scope.selectedRow.Price;
          temp -= $scope.selectedRow.Price;
          if ($scope.tempSubTotal == 0) {
            temp = 0;
          }
          if ($scope.selectedRow.Qty == 0) {
            $scope.clearSelected(true);
          }
        }
      };

      $scope.clearSelected = function (flag) {
        if ($scope.selectedRow && $scope.selectedRow.Default != true) {
          if (flag == false) {
            temp = temp - SubItemTotalPrice;
            $scope.tempSubTotal = $scope.tempSubTotal - SubItemTotalPrice;
          }
          removeSelectedItem($scope.selectedRow.SubItemId);
          $scope.selectRow(null);
        }
      };

      $scope.clearAll = function () {
        angular.forEach($scope.pwp.selectedItems, function (item, key) {
          if (item) {
            removeSelectedItem(key);
            $scope.tempSubTotal = 0;
            temp = 0;
          }
        });
        $scope.selectRow(null);
      };

      var removeSelectedItem = function (itemId) {
        var item = $scope.pwp.selectedItems[itemId];
        if (item) {
          $scope.pwp.Qty -= item.Qty;
          item.Qty = 0;
          delete $scope.pwp.selectedItems[itemId];
          var keys = _.keys($scope.pwp.selectedItems);
          if (keys.length > 0) {
            $scope.selectRow($scope.pwp.selectedItems[_.last(keys)]);
          }
        }
      };

      $scope.save = function () {
        if (!submitted) {
          if (!_.isEmpty($scope.pwp.selectedItems)) {
            submitted = true;
            var items = {};
            var itemT = 0;
            angular.forEach($scope.pwp.selectedItems, function (i) {
              items[i.SubItemId] = ItemService.getById(i.SubItemId, itemT);
            });
            $q.all(items).then(function (data) {
              // console.log(data);
              var promises  = [];
              $scope.pwp.item.ItemId = $scope.pwp.item.Id;
              $scope.pwp.item.ItemType = 'PWP';
              // promises.push(CartItemService.addItemToCart($scope.pwp.item));
              items = _.map(data, function (item, key) {
                var exItem = $scope.pwp.selectedItems[key];
                if (exItem) {
                  // if(exItem.DiscountId) {
                  //   // console.log(exItem);
                  //   DiscountService.getDiscountById(exItem.DiscountId).then(function(dis){
                  //     // console.log(dis);
                  //     DiscountService.saveTempDiscountItem(item, dis).then(function (item) {
                  //       // $scope.cart.selectedItem.discounted = true;
                  //       // console.log(item);
                  //       // CartItemService.setDiscountedItem(item.ItemId, item.ItemType, item, item.LineNumber);
                  //       // $scope.$emit("refresh-cart");
                  //     }, function (ex) {
                  //       console.log(ex);
                  //     });
                  //   });
                  // } else
                  if (exItem.Price) {
                    item.Price = exItem.Price;
                    item.OrgPrice = exItem.OrgPrice;
                    item.AlteredPrice = exItem.AlteredPrice;
                  }
                  item.Qty = exItem.Qty;
                  // renameProperty(item, 'SubItemId', 'ItemId');
                  item.ItemId = item.Id;
                  item.ItemType = 'PWI';
                  item.ParentItemLineNumber = $scope.pwp.item.LineNumber;
                  // return CartItemService.addItemToCart(item);
                  return item;
                }
                // return item;
              });


              CartItemService.addPWP($scope.header.DocNo, $scope.pwp.item, items).then(function (res) {
                var items = [];
                angular.forEach($scope.pwp.selectedItems, function (item, key) {
                  var deferred = $q.defer();
                  var savedItem = _.findWhere(res, { ItemId: item.SubItemId });
                  if (item.DiscountId) {
                    items.push({ item: savedItem, DiscountId: item.DiscountId });
                  }
                });
                // console.log(data);
                if (items.length > 0) {
                  return DiscountService.saveMultipleTempDiscountItem($scope.header.DocNo, items).then(function () {
                    $scope.$emit('refresh-cart');
                    $scope.$emit('pwpModal-close');
                  }, function (errors) {
                    console.log(errors);
                  });
                } else {
                  $scope.$emit('refresh-cart');
                  $scope.$emit('pwpModal-close', res[0]);
                  return $scope.pwp.item;
                }

              }, function (errors) {
                console.log(errors);
              });
              // console.log(promises);
              // $q.all(promises).then(function(data){
              //   // console.log(data);
              //   $scope.$emit('refresh-cart');
              //   $scope.$emit('pwpModal-close');
              // }, function(errors){
              //   console.log(errors);
              // });

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


      };

      $scope.close = function () {
        $scope.$emit('pwpModal-close');
      };

    }]);
