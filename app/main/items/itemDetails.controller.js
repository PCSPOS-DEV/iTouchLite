/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("ItemDetailsCtrl", ['$scope', 'ItemService', function ($scope, ItemService) {
    var self = this;
    self.item = {};

    $scope.$on("modal.shown", function(){
      if($scope.shownModal == 'itemDetails'){
        if($scope.cart.selectedItem){
          ItemService.getItemById($scope.cart.selectedItem.ItemId).then(function (item) {
            item.OrgPrice = item.OrgPrice.toFixed(2);
            self.item = item;
            // console.log(item);
          });
        }
      }
    });

    $scope.close = function () {
      $scope.$emit('itemDetailsModal-close');
    }
  }]);
