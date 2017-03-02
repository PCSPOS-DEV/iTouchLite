/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('SalesKitCtrl', ['$scope', 'ControlService', '$ionicPopup', 'CartItemService', 'BillService', 'Alert', '$ionicScrollDelegate', '$q',
    function ($scope, ControlService, $ionicPopup, CartItemService, BillService, Alert, $ionicScrollDelegate, $q) {

      $scope.title = "Sales Kits";
      $scope.selectedRow = null;
      var selectedItem = null;
      var submitted = false;

      $scope.$on('modal.shown', function(event, modal) {
        if($scope.shownModal == 'sk') {
          submitted = false;
          $ionicScrollDelegate.$getByHandle('salesKit').scrollTop();
          var customeQty = $scope.salesKitUpdate ? $scope.salesKitUpdateQty : $scope.qty.value;

          if (customeQty >= 1) {
            // $scope.salesKits.Qty = customeQty;
            $scope.salesKits.Qty = 0;
            $scope.salesKits.Quantity = customeQty;
            angular.forEach($scope.salesKits.list, function (item, key) {
              item.Quantity *= customeQty;
              $scope.salesKits.list[key] = item;
            });
            angular.forEach($scope.salesKits.selectedList, function (item, key) {
              item.Quantity *= customeQty;
              item.Qty *= customeQty;
              $scope.salesKits.selectedList[key].AddedAt = new Date();

              $scope.salesKits.selectedList[key] = item;
            });
          }
        }


      });

     $scope.selectComponent = function (sk) {
        $scope.salesKits.selected = sk;
     }

      $scope.selectItem = function (item) {
        addItem(angular.copy(item));
      }

      var addItem = function(item){
        var kit = $scope.salesKits.list[item.SalesKitId];
        var exItem = $scope.salesKits.selectedList[item.ItemId];
        if(kit && kit.Qty < kit.Quantity){
          kit.Qty++;
          if(exItem){
            exItem.Qty++;
            item = exItem;
          } else {
            item.Qty = 1;
            item.AddedAt = new Date();
            $scope.salesKits.selectedList[item.ItemId] = _.omit(item, 'Selections');
          }
          selectedItem = $scope.salesKits.selectedList[item.ItemId];
          kit.Selections = angular.copy($scope.salesKits.selectedList);
          $scope.selectedSalesKit = kit;
          $scope.selectRow(item)

        } else {
          Alert.warning('Child item quantity exceeded!');
        }
      }

      $scope.selectRow = function (item) {
        $scope.salesKits.selectedList = _.mapObject($scope.salesKits.selectedList, function (value, key) {
          value.selected = false;
          return value;
        });
        $scope.selectedRow = item;
        item.selected = true;
        $scope.salesKits.selectedList[item.ItemId] = item;
      }

      $scope.addSelected = function () {
        if($scope.selectedRow) {
          var sk = $scope.salesKits.list[$scope.selectedRow.SalesKitId];
          if (sk && sk.Qty < sk.Quantity && $scope.selectedRow.Default != true) {
            addItem($scope.selectedRow);
          }
        }
      }

      $scope.removeSelected = function () {
        if($scope.selectedRow && $scope.selectedRow.Qty > 0 && $scope.selectedRow.Default != true){
          var kit = $scope.salesKits.list[$scope.selectedRow.SalesKitId];
          $scope.selectedRow.Qty--;
          kit.Qty--;
          if($scope.selectedRow.Qty == 0){
            $scope.clearSelected();
          }
        }
      }

      $scope.clearSelected = function () {
        if($scope.selectedRow && $scope.selectedRow.Default != true){
          if($scope.selectedRow.Qty >= 0){
            var kit = $scope.salesKits.list[$scope.selectedRow.SalesKitId];
            if(kit.Qty > 0){
              kit.Qty -= $scope.selectedRow.Qty;
            }
            removeSelectedItem($scope.selectedRow.SalesKitId, $scope.selectedRow.ItemId);

            $scope.selectedRow = null;
          }
        }
      }

      $scope.clearAll = function () {
        angular.forEach($scope.salesKits.selectedList, function (value, key) {
          if(value && value.Default != true){
            removeSelectedItem(value.SalesKitId, value.ItemId);

            $scope.selectedRow = null;
            if($scope.salesKits.list[value.SalesKitId]){
              $scope.salesKits.list[value.SalesKitId].Qty = 0;
            }
          }
        });

      }

      var removeSelectedItem =  function (salesKitId, ItemId) {
        var sk = $scope.salesKits.list[salesKitId];
        if(sk){
          sk.selected = false;
          $scope.salesKits.list[salesKitId] = sk;
          delete $scope.salesKits.selectedList[ItemId];
        }
      };

      $scope.save = function () {
        if(!submitted){
          if(full()){
            submitted = true;
            var item = angular.copy($scope.salesKits);
            var omitList = ['$$hashKey', 'Default', 'Quantity', 'Priority', 'PLU_Description1', 'PLU_Description2', 'KitchenId', 'SubPlu1Id', 'SubPlu2Id', 'SubPlu3Id', 'DepartmentId', 'UOM_Id', 'HouseBarCode', 'Selected', 'AddedAt', 'key'];
            var selectedList = [];
            _.map(item.selectedList, function (i) {
              if(i){
                if(!i.OrgPrice) i.OrgPrice = i.Price;
                if(!i.AlteredPrice) i.AlteredPrice = i.Price;
                if(!i.StdCost) i.StdCost = i.Price;

                selectedList.push(_.omit(i, omitList));
              }
            });
            item.selectedList = selectedList;
            var operations = [];
            item.Qty = $scope.salesKits.customQuantity;
            if($scope.salesKitUpdate){
              var oldItem = $scope.cart.selectedItem;
              // console.log(oldItem);
              operations.push(BillService.voidItem(oldItem));
              var item = angular.copy(selectedItem);
              item.LineNumber = oldItem.LineNumber;
              item.DocNo = oldItem.DocNo;
              item.ParentItemLineNumber = oldItem.ParentItemLineNumber;
              item.ItemType = 'SKI';
              item.Price = item.AdditionalPrice;
              if(!item.OrgPrice) item.OrgPrice = item.AdditionalPrice;
              if(!item.AlteredPrice) item.AlteredPrice = item.AdditionalPrice;
              if(!item.StdCost) item.StdCost = item.AdditionalPrice;
              operations.push(CartItemService.addItemToCart(item, true));

            } else {
              operations.push(CartItemService.addSalesKitItemToCart(item));
            }

            $q.all(operations).then(function (item) {
              selectedItem = null;
              $scope.refreshCart().then(function(){
                $scope.scrollTo(item.LineNumber);
                $scope.qty.value = 1;
                $scope.selectItemWithLineNumber(item.LineNumber);
              });
              $scope.$emit('skModalModal-save');

            }).catch(function (err) {
              console.log(err);
            });
          } else {
            Alert.warning('All the child items must be selected before proceeding');
          }
        }
      }

      var full = function(){
        var items = 0;
        angular.forEach($scope.salesKits.selectedList, function(item){
          if(!item.Default){
            items += item.Qty;
          }
        });
        return items == $scope.salesKits.Quantity;
      }

      $scope.close = function () {
        $scope.$emit('skModalModal-close');
      }

    }]);
