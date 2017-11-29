/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('BillSuspendViewCtrl', ['$scope', 'PrinterSettings', 'HistoryService', '$q', 'Reciept', 'LocationService', '$ionicScrollDelegate',
    function ($scope, PrinterSettings, HistoryService, $q, Reciept, LocationService, $ionicScrollDelegate) {
      $scope.settings = {};
      $scope.bill = {
        header: null,
        items: null,
        transactions: null,
        discounts: null
      };
      $scope.location = LocationService.currentLocation;

      $scope.$on('modal.shown', function (event, modal) {
        if (modal.id === 6) {
          refresh();
          $ionicScrollDelegate.scrollTop();
        }
      });

      var refresh = function () {
        if ($scope.selectedItem) {
          PrinterSettings.get().then(function (data) {
            $scope.settings = data;
          });

          Reciept.fetchSuspendData($scope.selectedItem.DocNo).then(function (data) {
            data.header.Title = 'Suspend';
            data.header.BusinessDate = moment(data.header.BusinessDate).format('YYYY-MM-D');
            data.header.SysDateTime = moment(data.header.SysDateTime).format('YYYY-MM-D h:mm:ss');
            $scope.bill = data;
          }, function (ex) {
            console.log(ex);
          });
        }

      };

      $scope.printSuspendReciept = function (DocNo){
        if(DocNo){
          Reciept.printSuspend(DocNo);
        }
      }

      $scope.close = function(){
        $scope.$emit('bill.modal.close');
      }


    }]);
