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
        if($scope.shownModal == 'billView'){
          refresh();
        }
      });

      var refresh = function () {
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
