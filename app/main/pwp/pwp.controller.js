/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('PWPCtrl', ['$scope', 'ControlService', '$ionicPopup', 'CartItemService', 'BillService', 'ItemService', '$q', 'DiscountService', 'Alert', '$timeout', 'SettingsService', 'LogService',
    function ($scope, ControlService, $ionicPopup, CartItemService, BillService, ItemService, $q, DiscountService, Alert, $timeout, SettingsService, LogService) {
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();
      // debugLog = SettingsService.StartDebugLog();
      // debugLog.log(': ' + err, 4);
      $scope.title = 'PWP';
      $scope.selectedRow = null;
      //var selectedItem = null;
      var submitted = false;
      $scope.tempSubTotal = 0;
      var temp = 0;
      SubItemTotalPrice = 0;
      $scope.disableP = false;
      $scope.disableA = false;

      $scope.$on('modal.shown', function () {
        if ($scope.shownModal == 'pwp') {
          submitted = false;
          $scope.pwp.selectedItems = {};
          $scope.tempSubTotal = 0;
          temp = 0;
          $scope.pwp.Qty = 0;
        }
      });

      var checkQuantities = function (pwp) {
        var times = Math.floor(pwp.QtyEntered / pwp.Quantity);
        console.log('times : ' + times);
        pwp.MaxQuantity = pwp.MaxQuantity * times;
        return pwp;
      };

      $scope.selectItem = function (item) {
        // $scope.disableA = true;
        Alert.showLoading();
        addItem(item);
        $scope.selectRow(item);
        $timeout(function () {
          $scope.disableA = false;
        }, 100);
        Alert.hideLoading();
      };

      var addPrice = function (item, discPercent) {
        // debugLog.log('--*-- PWP Discount Start --*-- ', 7);
        console.log(item);
        // debugLog.log('Item : ' + item.ItemDesc1, 7);
        // debugLog.log('discPercent : ' + discPercent, 7);

        return ItemService.getPrice(item.Plu, parseInt(item.PriceGroupId)).then(function (data) {
          var Bdisc = data ? data.AlteredPrice : 0;
          var cal = (((Bdisc / 100) * discPercent).toFixed(3));
          var s1 = Math.floor(cal);
          var s2 = (cal * 100) - (s1 * 100);
          var s3 = s2.toFixed(0) / 100;
          // debugLog.log('discAmount : ' + (s1+s3), 7);
          // console.log(s3);
          var Adisc = (Bdisc - (s1 + s3)).roundTo(2).toFixed(2);
          // debugLog.log('Price After Disc : ' + Adisc, 7);
          // debugLog.log('--*-- PWP Discount End --*-- ', 7);
          // console.log(Adisc);
          item.AlteredPrice = (((Bdisc / 100) * discPercent).toFixed(3));
          item.Price = parseFloat(Adisc);
          item.SubItemPrice = parseFloat(Adisc);
          item.OrgPrice = data ? data.OrgPrice : 0;
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
        $scope.disableP = true;
        addItem($scope.selectedRow);
        eventLog.log('pwp addSelected');
        $timeout(function () {
          $scope.disableP = false;
        }, 200);
      };

      var tempD = 0;
      var addItem = function (item) {
        if (item) {
          if (item.SubItemMaxQty <= item.Qty) {
            Alert.warning('You have selected the maximum child item allowed for this item.');
            eventLog.log('You have selected the maximum child item allowed for this item.');
            Alert.hideLoading();
            return true;
          }
          else if ($scope.pwp.Qty && $scope.pwp.TotalChildQty <= $scope.pwp.Qty) {
            Alert.warning('You have selected the maximum child item allowed for this PWP.');
            eventLog.log('You have selected the maximum child item  allowed for this PWP.');
            Alert.hideLoading();
            tempD = 1;

            return true;
          }
          $timeout(function () {
            temp = temp + parseFloat(item.Price);
            if (isNaN(temp)) {
              console.log('do nothing');
            }
            else if (temp <= $scope.pwp.MaxPrice || $scope.pwp.MaxPrice == 0) {
              $scope.tempSubTotal = temp;
              if ($scope.selectedRow != null) {
                SubItemTotalPrice = $scope.selectedRow.Qty * $scope.selectedRow.SubItemPrice;
              } else {
                $scope.selectRow( $scope.previousitem);
                if ($scope.selectedRow != null) {
                  SubItemTotalPrice = $scope.selectedRow.Qty * $scope.selectedRow.SubItemPrice;
                }
              }
            } else {
              if (tempD == 0) {
                Alert.warning('The child total price exceed the limit of maximum price.');
                eventLog.log('The child total price exceed the limit of maximum price.');
              } else {
                tempD = 0;
              }

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
            eventLog.log('--*-- PWP Child Control END --*-- ', 7);
            LogService.SaveLog();
          }, 200);

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
            if (item.DiscountId == null) {
              if (item.SubItemPrice >= 0) {
                item.Price = item.SubItemPrice;
                // item.OrgPrice = item.SubItemPrice;
                item.AlteredPrice = item.SubItemPrice;
                promise = $q.when(item);
              } else {
                promise = addPrice(item);
              }
            } else {
              if (item.SubItemPrice != 0 && item.DiscountId != null) {
                item.Price = item.SubItemPrice;
                // item.OrgPrice = item.SubItemPrice;
                item.AlteredPrice = item.SubItemPrice;
                promise = $q.when(item);
              } else {
                DiscountService.getDiscountById(item.DiscountId).then(function (dis) {
                  if (dis == null) {
                    addPrice(item, 0);
                  } else {
                    addPrice(item, dis.Percentage);
                  }
                });
                promise = $q.when(item);
                // promise = addPrice(item);
              }
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
        console.log($scope.selectedRow);
        if ($scope.selectedRow == null || $scope.selectedRow == undefined || $scope.selectedRow == '') {
          console.log('do nothing');
        } else {
          Alert.showLoading();
          if ($scope.selectedRow && $scope.selectedRow.Default != true) {
            if ($scope.selectedRow.Qty == undefined) {
              Alert.warning('No selected item to clear.');
              return true;
            } else if ($scope.selectedRow.Qty > 0 ) {
              eventLog.log('pwp minus Qty');
              $scope.selectedRow.Qty --;
              var promise;
              if ($scope.selectedRow.DiscountId == null) {
                if ($scope.selectedRow.SubItemPrice >= 0) {
                  $scope.selectedRow.Price = $scope.selectedRow.SubItemPrice;
                  // item.OrgPrice = item.SubItemPrice;
                  $scope.selectedRow.AlteredPrice = $scope.selectedRow.SubItemPrice;
                  promise = $q.when($scope.selectedRow);
                } else {
                  promise = addPrice($scope.selectedRow);
                }
              } else {
                $scope.selectedRow.Price = $scope.selectedRow.SubItemPrice;
                // item.OrgPrice = item.SubItemPrice;
                $scope.selectedRow.AlteredPrice = $scope.selectedRow.SubItemPrice;
                promise = $q.when($scope.selectedRow);
              }
              promise.then(function (item) {
                $scope.pwp.Qty--;
                temp = temp - item.SubItemPrice;
                $scope.tempSubTotal = $scope.tempSubTotal - item.SubItemPrice;
                $scope.pwp.selectedItems[item.SubItemId] = item;
                if (item.Qty == 0) {
                  $scope.clearSelected(true);
                }
              });
            }
            // $scope.selectRow(null);
          }
          Alert.hideLoading();
        }
      };

      $scope.clearSelected = function (flag) {
        if ($scope.selectedRow == null) {
          console.log('do nothing');
        } else {
          Alert.showLoading();
          if ($scope.selectedRow && $scope.selectedRow.Default != true) {
            if (flag == false) {
              if ($scope.selectedRow.Qty == undefined) {
                Alert.warning('No selected item to clear.');
                return true;
              }
              eventLog.log('pwp clearSelected');
              SubItemTotalPrice = $scope.selectedRow.Qty * $scope.selectedRow.SubItemPrice;
              temp = temp - SubItemTotalPrice;
              $scope.tempSubTotal = $scope.tempSubTotal - SubItemTotalPrice;
            }
            removeSelectedItem($scope.selectedRow.SubItemId);
            $scope.selectRow(null);
          }
          Alert.hideLoading();
        }
      };

      $scope.clearAll = function () {
        if ($scope.selectedRow == null) {
          console.log('do nothing');
        } else {
          Alert.showLoading();
          angular.forEach($scope.pwp.selectedItems, function (item, key) {
            if (item) {
              eventLog.log('pwp clear all item');
              removeSelectedItem(key);
              $scope.tempSubTotal = 0;
              temp = 0;
            }
          });
          $scope.selectRow(null);
          Alert.hideLoading();
        }
      };

      var removeSelectedItem = function (itemId) {
        if ($scope.selectedRow == null) {
          console.log('do nothing');
        } else {
          Alert.showLoading();
          var item = $scope.pwp.selectedItems[itemId];
          if (item) {
            eventLog.log('pwp removeSelectedItem');
            $scope.pwp.Qty -= item.Qty;
            item.Qty = 0;
            delete $scope.pwp.selectedItems[itemId];
            var keys = _.keys($scope.pwp.selectedItems);
            if (keys.length > 0) {
              $scope.selectRow($scope.pwp.selectedItems[_.last(keys)]);
            }
          }
          Alert.hideLoading();
        }
      };

      $scope.save = function () {
        Alert.showLoading();
        if (!submitted) {
          if (!_.isEmpty($scope.pwp.selectedItems)) {
            submitted = true;
            var items = {};
            var itemT = 0;
            angular.forEach($scope.pwp.selectedItems, function (i) {
              items[i.SubItemId] = ItemService.getById(i.SubItemId, itemT);
            });
            // console.log(items);
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
                if (items.length > 0) {
                  return DiscountService.saveMultipleTempDiscountItem($scope.header.DocNo, items).then(function () {
                    $scope.refreshCart().then(function () {
                      $scope.PostApi(res, 2);
                    });
                  }).finally(function () {
                    $scope.$emit('pwpModal-close', res[0]);
                  });
                } else {
                  $scope.refreshCart().then(function () {
                    $scope.PostApi(res, 2);
                  });
                  $scope.$emit('pwpModal-save', res[0]);
                  return $scope.pwp.item;
                }

              }, function (errors) {
                errorLog.log('artItemService.addPWP Error : ' + errors);
                LogService.SaveLog();
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
        Alert.hideLoading();

      };

      $scope.close = function () {

        $scope.tempSubTotal = 0;
        temp = 0;
        $scope.$emit('pwpModal-close');
      };

    }]);
