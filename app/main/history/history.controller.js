/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('HistoryCtrl', ['$scope', 'HistoryService', 'BillService', 'CartItemService', 'PrinterSettings', '$ionicModal',
    function ($scope, HistoryService, BillService, CartItemService, PrinterSettings, $ionicModal) {
      $scope.items = [];
      $scope.selectedItem = null;
      $scope.search = "";

      $scope.$on("$ionicView.beforeEnter", function(event, data){
        refresh();
      });

      var refresh = function () {
        HistoryService.getAll().then(function(items) {
          console.log(items);
          $scope.items = _.values(items);
        });
      };

      /**
       * Initiating Sub PLU modal dialog
       */
      $ionicModal.fromTemplateUrl('history/billModal.html', {
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
        $scope.selectedItem = item;
        $scope.modal.show();
      }


    }]);
