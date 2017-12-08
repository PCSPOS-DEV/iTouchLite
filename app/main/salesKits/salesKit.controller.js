/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('SalesKitCtrl', ['$scope', 'ControlService', '$ionicPopup', 'CartItemService', 'BillService', 'Alert', '$ionicScrollDelegate', '$q',
    function ($scope, ControlService, $ionicPopup, CartItemService, BillService, Alert, $ionicScrollDelegate, $q) {

      $scope.title = 'Sales Kits';
      $scope.selectedRow = null;
      var selectedItem = null;
      var submitted = false;
      var oldItem = null;
      var update = false;
      var customQty = 0;
      var oldCustomQty = 0;

      $scope.$on('orderObjectBy', function () {
        return function (items, field, reverse) {
          var filtered = [];
          angular.forEach(items, function (item) {
            filtered.push(item);
          });
          filtered.sort(function (a, b) {
            return (a[field] > b[field] ? 1 : -1);
          });
          if (reverse) {filtered.reverse();}
          return filtered;
        };
      });

      $scope.$on('modal.shown', function (event, modal) {
        if (modal.id === 1) {
          $scope.selectedRow = null;
          submitted = false;
          $ionicScrollDelegate.$getByHandle('salesKit').scrollTop();
          $ionicScrollDelegate.$getByHandle('salesKitSelectedItems').scrollTop();
          customQty = $scope.qty.value;

          if (modal.data) {
            $scope.salesKits = modal.data.salesKit;
            update = modal.data.update;
            if (modal.data.update) {
              update = true;
              oldItem = $scope.cart.selectedItem;
              customQty = oldItem.Qty;
              $scope.salesKits.selectedList = {};

            } else {
              angular.forEach($scope.salesKits.selectedList, function (item, key) {
                item.Quantity *= customQty;
                item.Qty *= customQty;
                $scope.salesKits.selectedList[key].AddedAt = new Date();

                $scope.salesKits.selectedList[key] = item;
              });
            }
            angular.forEach($scope.salesKits.list, function (item, key) {
              if (oldItem && oldItem.ItemId == item.ItemId)
              {
                oldCustomQty = oldItem.Qty / item.QtyValid;
              }
              item.Quantity *= customQty;
              $scope.salesKits.list[key] = item;
            });

            if (customQty >= 1) {
              // $scope.salesKits.Qty = customeQty;
              $scope.salesKits.Qty = 0;
              $scope.salesKits.Quantity = customQty;
            }

            /*Yi Yi Po*/
            angular.forEach($scope.salesKits.component, function (component, key) {
              if (update) {
                if ($scope.salesKits.list[oldItem.ItemId].componetid == component.ItemId) {
                  component.Quantity = oldCustomQty;
                  $scope.salesKits.selected = component;
                }
                else
                    {component.Quantity = 0;}
              }
              else
               {component.Quantity = customQty;}
              component.OrderQty = 0;
              $scope.salesKits.component[key] = component;
            });
            /*--*/
          }

        }


      });

      $scope.selectComponent = function (sk) {
        $scope.salesKits.selected = sk;
      };

      $scope.selectItem = function (item) {
        addItem(angular.copy(item));
      };

      var addItem = function (item) {

        var oldItem = null;
        var kit = $scope.salesKits.list[item.ItemId];
        var exItem = $scope.salesKits.selectedList[item.ItemId];
        var currentTotalQty = getOrderTotalQty(kit);
        var currentOrderQty = $scope.qty.value;

        var validComponetQty = $scope.salesKits.component[kit.componetid].Quantity - $scope.salesKits.component[kit.componetid].OrderQty;
        var totalComponetQty = $scope.salesKits.component[kit.componetid].Quantity + $scope.salesKits.component[kit.componetid].OrderQty;

        if ($scope.cart.selectedItem && $scope.cart.selectedItem.ItemId == item.ItemId)
          {oldItem = $scope.cart.selectedItem;}

        if (update) {currentOrderQty = oldCustomQty;}
        if (totalComponetQty != currentOrderQty) {currentOrderQty = totalComponetQty;}

        if (currentTotalQty < currentOrderQty && validComponetQty != 0)
         {
          $scope.salesKits.component[kit.componetid].OrderQty = currentTotalQty + 1;
          kit.Qty += kit.QtyValid;
          if (exItem)
             {
            exItem.Qty += kit.QtyValid;
            item = exItem;
          }
          else
             {
            item.AddedAt = new Date();
            item.Qty = kit.QtyValid;
            item.componetId = kit.componetid;
            $scope.salesKits.selectedList[item.ItemId] = _.omit(item, 'Selections');

          }
          selectedItem = $scope.salesKits.selectedList[item.ItemId];
          $scope.selectedSalesKit = kit;
          $scope.selectRow(item);
        }
        else
        {
          Alert.warning('Child item quantity exceeded!');
        }

      };

      $scope.selectRow = function (item) {
        $scope.salesKits.selectedList = _.mapObject($scope.salesKits.selectedList, function (value, key) {
          value.selected = false;
          return value;
        });
        $scope.selectedRow = item;
        item.selected = true;
        $scope.salesKits.selectedList[item.ItemId] = item;
      };

      $scope.addSelected = function () {
        if ($scope.selectedRow) {
          //var sk = $scope.salesKits.list[$scope.selectedRow.SalesKitId];
          var sk = $scope.salesKits.list[$scope.selectedRow.ItemId];
          if (sk && sk.Qty < sk.Quantity && $scope.selectedRow.Default != true) {
            addItem($scope.selectedRow);
          } else {
            Alert.warning('Child item quantity exceeded!');
          }
        }
      };

      $scope.removeSelected = function () {
        if ($scope.selectedRow && $scope.selectedRow.Qty > 0 && $scope.selectedRow.Default != true) {
          //var kit = $scope.salesKits.list[$scope.selectedRow.SalesKitId];
          var kit = $scope.salesKits.list[$scope.selectedRow.ItemId];
          kit.Qty -= kit.QtyValid;
          $scope.selectedRow.Qty -= kit.QtyValid;

          /*$scope.selectedRow.Qty--;
          kit.Qty--;*/
          if ($scope.selectedRow.Qty == 0) {
            $scope.clearSelected();
          }
          else {
            $scope.salesKits.component[kit.componetid].OrderQty--;
          }
        }
      };

      $scope.clearSelected = function () {
        if ($scope.selectedRow && $scope.selectedRow.Default != true) {
          if ($scope.selectedRow.Qty >= 0) {
            //var kit = $scope.salesKits.list[$scope.selectedRow.SalesKitId];
            var kit = $scope.salesKits.list[$scope.selectedRow.ItemId];
            if (kit.Qty > 0) {
              kit.Qty -= $scope.selectedRow.Qty;
            }
            removeSelectedItem($scope.selectedRow.SalesKitId, $scope.selectedRow.ItemId);

            $scope.selectedRow = null;
          }
        }
      };

      $scope.clearAll = function () {
        angular.forEach($scope.salesKits.selectedList, function (value, key) {

          if (value && value.Default != true) {
            removeSelectedItem(value.SalesKitId, value.ItemId);
            $scope.selectedRow = null;
            /*if($scope.salesKits.list[value.SalesKitId]){
              $scope.salesKits.list[value.SalesKitId].Qty = 0;
            }*/
            if ($scope.salesKits.list[value.ItemId]) {
              $scope.salesKits.list[value.ItemId].Qty = 0;
            }
          }
        });

      };

      var removeSelectedItem =  function (salesKitId, ItemId) {
        //var sk = $scope.salesKits.list[salesKitId];
        var sk = $scope.salesKits.list[ItemId];
        if (sk) {
          sk.selected = false;
          //$scope.salesKits.list[salesKitId] = sk;
          if ($scope.salesKits.selectedList[ItemId].Qty != 0)
            {$scope.salesKits.component[sk.componetid].OrderQty -= $scope.salesKits.selectedList[ItemId].Qty / $scope.salesKits.selectedList[ItemId].QtyValid;}
          else
            {$scope.salesKits.component[sk.componetid].OrderQty--;}
          $scope.salesKits.list[ItemId] = sk;
          delete $scope.salesKits.selectedList[ItemId];
        }
      };

      $scope.save = function () {
        if (!submitted) {
          if (full()) {
            submitted = true;
            var item = angular.copy($scope.salesKits);
            var omitList = ['$$hashKey', 'Default', 'Quantity', 'Priority', 'PLU_Description1', 'PLU_Description2', 'KitchenId', 'SubPlu1Id', 'SubPlu2Id', 'SubPlu3Id', 'DepartmentId', 'UOM_Id', 'HouseBarCode', 'Selected', 'AddedAt', 'key'];
            var selectedList = [];
            _.map(item.selectedList, function (i) {
              if (i) {
                //if(!i.OrgPrice) i.OrgPrice = i.Price;
                //if(!i.AlteredPrice) i.AlteredPrice = i.Price;
                //if(!i.StdCost) i.StdCost = i.Price;
                item.Price = item.AdditionalPrice;
                if (!item.OrgPrice) {item.OrgPrice = item.AdditionalPrice;}
                if (!item.AlteredPrice) {item.AlteredPrice = item.AdditionalPrice;}
                if (!i.StdCost) {i.StdCost = i.AdditionalCost;}
                selectedList.push(_.omit(i, omitList));
              }
            });
            item.selectedList = selectedList;
            var operations = [];
            var voidProm = null;
            item.Qty = customQty;
            if (update) {
              // var oldItem = $scope.cart.selectedItem;
              // console.log(oldItem);
              voidProm = BillService.voidItem(oldItem);
              var item = angular.copy(selectedItem);
              angular.forEach($scope.salesKits.selectedList, function (item) {
                item.LineNumber = oldItem.LineNumber;
                item.DocNo = oldItem.DocNo;
                item.ParentItemLineNumber = oldItem.ParentItemLineNumber;
                item.ItemType = 'SKI';
                item.Price = item.AdditionalPrice;
                if (!item.OrgPrice) {item.OrgPrice = item.AdditionalPrice;}
                if (!item.AlteredPrice) {item.AlteredPrice = item.AdditionalPrice;}
                //if(!item.StdCost) item.StdCost = item.AdditionalPrice;
                if (!item.StdCost) {item.StdCost = item.AdditionalCost;}

                operations.push(CartItemService.addItemToCart(oldItem.DocNo, item, true));
              });

            } else {
              voidProm = $q.when(true);
              operations.push(CartItemService.addSalesKitItemToCart(item));
            }

            voidProm.then(function () {
              return $q.all(operations).then(function (item) {
                selectedItem = null;
                $scope.refreshCart().then(function () {
                  $scope.scrollTo(item.LineNumber);
                  $scope.qty.value = 1;
                  $scope.selectItemWithLineNumber(item.LineNumber);
                });
              }).finally(function () {
                $scope.$emit('skModalModal-save');
                  // submitted = false;
              });
            }).catch(function (err) {
              console.log(err);
            });
          } else {
            //Alert.warning('All the child items must be selected before proceeding');
            Alert.warning('Entry not completed!');
          }
        }
      };

      var full = function () {
        /*
        var items = 0;
        angular.forEach($scope.salesKits.selectedList, function(item){
          if(!item.Default){
            items += item.Qty;
          }
        });
        return items == $scope.salesKits.Quantity;*/
        /*Yi Yi Po*/
        var items = 0;
        angular.forEach($scope.salesKits.selectedList, function (item) {
          if (!item.Default) {
            items += (item.Qty / item.QtyValid);
          }
        });
        var componentCount = Object.keys($scope.salesKits.component).length;
        var currentOrderQty = $scope.qty.value;
        if (update) {
          currentOrderQty = oldCustomQty;
          componentCount = 1;
        }
        return items == (componentCount * currentOrderQty);
        /*--*/

      };

      $scope.close = function () {
        //$scope.cart.selectedItem=null;
        $scope.$emit('skModalModal-close');
      };

      var getOrderTotalQty = function (kit) {
        var currentTotalQty = 0;
        angular.forEach($scope.salesKits.selectedList, function (exitingItem) {
          if (exitingItem.Selectable) {
            if (exitingItem.componetid == kit.componetid)
            {
              currentTotalQty += (exitingItem.Qty / exitingItem.QtyValid);
            }
          }
        });
        return currentTotalQty;
      };

    }]);
