/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('DiscountCtrl', ['$scope', 'DiscountService', '$ionicPopup', 'Alert',
    function ($scope, DiscountService, $ionicPopup, Alert) {
      var discountsSet = {
        type1: [],
        type2: []
      };
      $scope.type = 2;
      var titles = {
        1: 'Amounts',
        2: 'Percentages'
      };
      $scope.title = '';

      DiscountService.get().then(function(dis) {
        angular.forEach(dis, function (item) {
          if(item.DiscountType == '1'){
            discountsSet.type1.push(item);
          } else {
            discountsSet.type2.push(item);
          }
        });

        $scope.setType($scope.type);
      }, function (er) {
        console.log(er);
      });


      $scope.setType = function (t) {
        $scope.type = t;
        $scope.discounts = discountsSet['type'+t];
        $scope.title = titles[t];
      };

      $scope.selectDiscount = function (discount) {
        if(discount){
          console.log(discount);
          if(discount.DiscountType == 1 && discount.Amount == 0){
            $scope.data = {};

            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
              template: '<input type="tel" ng-model="data.amount">',
              title: 'Enter Amount',
              subTitle: '',
              scope: $scope,
              buttons: [
                {text: 'Cancel'},
                {
                  text: '<b>Save</b>',
                  type: 'button-positive',
                  onTap: function (e) {
                    if (!$scope.data.amount || _.isNaN($scope.data.amount) || $scope.data.amount == 0) {
                      //don't allow the user to close unless he enters wifi password
                      e.preventDefault();
                    } else {
                      return $scope.data.amount;
                    }
                  }
                }
              ]
            });

            myPopup.then(function (res) {
              saveDiscount(discount, res);
            });
          } else {
            saveDiscount(discount);
          }
        }
      }

      var saveDiscount = function (discount, amount) {
        amount = parseFloat(amount);
        DiscountService.saveTempDiscountItem(angular.copy($scope.cart.selectedItem), discount, amount).then(function (item) {
          // $scope.cart.selectedItem.discounted = true;
          // console.log(item);
          // CartItemService.setDiscountedItem(item.ItemId, item.ItemType, item, item.LineNumber);
          $scope.$emit("refresh-cart");
          $scope.$emit("discountModel-close");
        }, function (err) {
          Alert.error(err);
          $scope.$emit("discountModel-close");
        });
      }

      $scope.close = function () {
        $scope.$emit("discountModel-close");
      }

    }]);


