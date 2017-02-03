/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('BillViewCtrl', ['$scope', 'PrinterSettings', 'HistoryService', '$q', 'Reciept', 'LocationService',
    function ($scope, PrinterSettings, HistoryService, $q, Reciept, LocationService) {
      $scope.settings = {};
      $scope.bill = {
        header: null,
        items: null,
        transactions: null,
        discounts: null
      };
      $scope.location = LocationService.currentLocation;

      $scope.$on("modal.shown", function(event){
        refresh();
      });

      var refresh = function () {
        PrinterSettings.get().then(function (data) {
          $scope.settings = data;
        });

        $q.all({
          header: Reciept.getBillHeader($scope.selectedItem.DocNo),
          items: Reciept.getBillItems($scope.selectedItem.DocNo),
          transactions: Reciept.getBillTransactions($scope.selectedItem.DocNo)
        }).then(function (data) {
          $scope.bill = data;
        }, function (ex) {
          console.log(ex);
        });
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
