/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('BillViewCtrl', ['$scope', 'PrinterSettings', 'HistoryService', '$q',
    function ($scope, PrinterSettings, HistoryService, $q) {
      $scope.settings = {};
      $scope.bill = {
        header: null,
        items: null,
        transactions: null,
        discounts: null
      };

      $scope.$on("modal.shown", function(event){
        refresh();
      });

      var refresh = function () {
        console.log($scope.selectedItem);
        PrinterSettings.get().then(function (data) {
          $scope.settings = data;
        });

        $q.all({
          header: HistoryService.getHeader($scope.selectedItem.DocNo),
          items: HistoryService.getItems($scope.selectedItem.DocNo),
          transactions: HistoryService.getTransactions($scope.selectedItem.DocNo),
          discounts: HistoryService.getDiscounts($scope.selectedItem.DocNo)
        }).then(function (data) {
          console.log(data);
          $scope.bill = data;
        }, function (ex) {
          console.log(ex);
        });
      };


    }]);
