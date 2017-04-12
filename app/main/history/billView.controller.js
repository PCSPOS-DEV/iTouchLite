/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('BillViewCtrl', ['$scope', 'PrinterSettings', 'HistoryService', '$q', 'Reciept', 'LocationService', '$ionicScrollDelegate',
    function ($scope, PrinterSettings, HistoryService, $q, Reciept, LocationService, $ionicScrollDelegate) {
      $scope.settings = {};
      $scope.bill = {
        header: null,
        items: null,
        transactions: null,
        discounts: null
      };
      $scope.location = LocationService.currentLocation;

      $scope.$on("modal.shown", function(event, modal){
        if(modal.id == 6){
          refresh();
          $ionicScrollDelegate.scrollTop();
        }
      });

      var refresh = function () {
        if($scope.selectedItem){
          PrinterSettings.get().then(function (data) {
            $scope.settings = data;
          });

          Reciept.fetchData($scope.selectedItem.DocNo).then(function (data) {
            // console.log(data);
            data.header.Title = '';
            switch(data.header.DocType){
              case 'AV':
                data.header.Title = 'Abort';
                break;
              case 'VD':
                data.header.Title = 'Transaction Void '+data.header.SalesDocNo;
                break;
            }
            var subTotal = 0;
            data.items = _.map(data.items, function(item){
              subTotal += (item.SubTotal + item.Tax5Amount).roundTo(2);
              item.discounts = _.map(item.discounts, function(discount){
                if(discount.Description1) {
                  subTotal -= discount.DiscountAmount;
                }
                return discount;
              });

              return item;
            });

            var tenderDiscountTotal = 0;
            data.tenderDiscounts = _.map(data.tenderDiscounts, function(tDis){
              tenderDiscountTotal += tDis.Amount;

              return tDis;
            });
            data.subTotal = subTotal.roundTo(2);
            data.tenderDiscountTotal = tenderDiscountTotal.roundTo(2);
            $scope.bill = data;
          }, function (ex) {
            console.log(ex);
          });
        }

      };

      $scope.printReciept = function(DocNo){
        if(DocNo){
          Reciept.print(DocNo);
        }
      }

      $scope.close = function(){
        $scope.$emit('bill.modal.close');
      }


    }]);
