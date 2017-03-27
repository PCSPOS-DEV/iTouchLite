/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('TenderDiscountCtrl', ['$scope', 'DiscountService', '$ionicPopup', 'Alert',
    function ($scope, DiscountService, $ionicPopup, Alert) {
      var discountsSet = {
        type1: [],
        type2: []
      };
      $scope.customAmount = 0;
      $scope.type = 2;
      var titles = {
        1: 'Amounts',
        2: 'Percentages'
      };
      $scope.title = '';
      var submitted = false;

      $scope.$on('modal.shown', function(event, data){
        if($scope.shownModal == 'tenderDiscounts'){
          submitted = false;
          refresh();
        }
      });


      var refresh = function(){
        discountsSet.type1 = [];
        discountsSet.type2 = [];
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
      }


      $scope.setType = function (t) {
        $scope.type = t;
        $scope.discounts = discountsSet['type'+t];
        $scope.title = titles[t];
      };

      $scope.selectDiscount = function (discount) {
        if(discount && submitted == false){
          submitted = true;
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
              if(res){
                saveDiscount(discount, res);
              }
            });
          } else {
            saveDiscount(discount, parseFloat(discount.Amount));
          }
        }

      }

      var saveDiscount = function (discount, amount) {
        amount = parseFloat(amount);
        DiscountService.prepareTenderDiscount($scope.tenderHeader, angular.copy($scope.billItems), discount, amount).then(function () {
          $scope.$emit("discountModel-close");
        }, function(ex){
          $scope.$emit("discountModel-close");
          Alert.warning(ex);
        });
      }

      $scope.close = function () {
        $scope.$emit('discountModel-close');
      }



    }]);


