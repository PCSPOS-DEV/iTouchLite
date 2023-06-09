/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('TenderDiscountCtrl', ['$scope', 'DiscountService', '$ionicPopup', 'Alert', 'BillService', 'LogService',
    function ($scope, DiscountService, $ionicPopup, Alert, BillService, LogService) {
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();
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

      $scope.$on('modal.shown', function (event, data) {
        if ($scope.shownModal == 'tenderDiscounts') {
          $scope.type = 2;
          submitted = false;
          refresh();
        }
      });


      var refresh = function () {
        discountsSet.type1 = [];
        discountsSet.type2 = [];
        DiscountService.get().then(function (dis) {
          eventLog.log('Data retrieved from DiscountService');
          angular.forEach(dis, function (item) {
            if (item.DiscountType == '1') {
              discountsSet.type1.push(item);
            } else {
              discountsSet.type2.push(item);
            }
          });

          $scope.setType($scope.type);
        }, function (er) {
          errorLog.log('TenderDiscount Error : ' + er);
          console.log(er);
        });
        LogService.SaveLog();
      };


      $scope.setType = function (t) {
        $scope.type = t;
        $scope.discounts = discountsSet['type' + t];
        $scope.title = titles[t];
      };

      $scope.selectDiscount = function (discount) {
        //if(discount && submitted == false){
        eventLog.log('Tender Discount : Start');
        if (discount) {
          if (discount.DiscountType == 1 && discount.Amount == 0) {
            eventLog.log('Tender Discount : 1st option');
            $scope.data = {};
            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
              template: '<input type="tel" ng-model="data.amount" autofocus="autofocus">',
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
              if (res) {
                saveDiscount(discount, res);
              }
            }).finally(function () {
                //submitted = false;
            });
          } else {
            eventLog.log('Tender Discount : 2nd option');
            saveDiscount(discount, parseFloat(discount.Amount));
          }
          eventLog.log('Tender Discount : Complete');
        }
        LogService.SaveLog();
      };

      var saveDiscount = function (discount, amount) {
        if (submitted == false) {
          submitted = true;
          amount = parseFloat(amount);
          BillService.getTempItems($scope.tenderHeader.DocNo).then(function (billItems) {
            DiscountService.prepareTenderDiscount($scope.tenderHeader, angular.copy(billItems), discount, amount).then(function () {
              eventLog.log('Tender Discount : saveDiscount');
            }, function (ex) {
              Alert.warning(ex);
            }).finally(function () {
                //submitted = false;
              $scope.$emit('discountModel-close');
            });
          });
        }
        /*DiscountService.prepareTenderDiscount($scope.tenderHeader, angular.copy($scope.billItems), discount, amount).then(function () {

        }, function(ex){
          Alert.warning(ex);
        }).finally(function () {
            submitted = false;
            $scope.$emit("discountModel-close");
        });*/
      };

      $scope.close = function () {
        $scope.$emit('discountModel-close');
      };


    }]);


