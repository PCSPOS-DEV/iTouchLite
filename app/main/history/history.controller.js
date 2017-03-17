/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('HistoryCtrl', ['$scope', 'HistoryService', 'BillService', 'CartItemService', 'PrinterSettings', '$ionicModal', 'Reciept', 'ControlService',
    function ($scope, HistoryService, BillService, CartItemService, PrinterSettings, $ionicModal, Reciept, ControlService) {
      $scope.items = [];
      $scope.selectedItem = null;
      $scope.search = { text: "" };

      $scope.$on("$ionicView.beforeEnter", function(event, data){
        $scope.search.text = "";
        refresh();
      });

      var refresh = function () {
        var bDate = ControlService.getBusinessDate(true);
        HistoryService.getAll(bDate).then(function(items) {
          $scope.items = _.values(items);
          $scope.items = _.map(items, function(item){
            switch(item.DocType){
              case 'VD':
                item.BillType = 'Void';
                break;
              case 'AV':
                item.BillType = 'Abort';
                break;
              default:
                item.BillType = 'Sales';
                break;
            }
            return item;
          });

        });
      };

      /**
       * Initiating Sub PLU modal dialog
       */
      $ionicModal.fromTemplateUrl('main/history/billModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
      });

      /**
       * Manages the sub PLU modal close event
       */
      $scope.modalClose = function () {
        $scope.modal.hide();
      }

      $scope.selectItem = function (item) {
        if($scope.modal){
          $scope.shownModal = 'billView';
          $scope.selectedItem = item;
          $scope.modal.show();
        }
      }

      $scope.clearSearch = function(){
        console.log('clear');
        $scope.search.text = "";
      }

      $scope.$on('bill.modal.close', function(){
        $scope.modal.hide();
      });

    }]);
