/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('HistoryCtrl', ['$scope', 'HistoryService', 'BillService', 'CartItemService', 'PrinterSettings', '$ionicModal', 'Reciept', 'ControlService', '$ionicScrollDelegate', 'LogService',
    function ($scope, HistoryService, BillService, CartItemService, PrinterSettings, $ionicModal, Reciept, ControlService, $ionicScrollDelegate, LogService) {
      $scope.items = [];
      $scope.selectedItem = null;
      $scope.search = { text: '' };
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();

      $scope.$on('$ionicView.beforeEnter', function (event, data) {
        $scope.search.text = '';
        refresh();
        $ionicScrollDelegate.scrollTop();
      });

      var refresh = function () {
        eventLog.log('ReceiptHistory : Start');
        var bDate = ControlService.getBusinessDate(true);
        HistoryService.getAll(bDate).then(function (items) {
          $scope.items = _.values(items);
          $scope.items = _.map(items, function (item) {
            switch (item.DocType) {
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
            item.Total = item.Total.toFixed(2);
            return item;
          });

        });
        eventLog.log('ReceiptHistory : Done');
        LogService.SaveLog();
      };

      /**
       * Initiating Sub PLU modal dialog
       */
      $ionicModal.fromTemplateUrl('main/history/billModal.html', {
        id: 6,
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
      });

      /**
       * Manages the sub PLU modal close event
       */
      $scope.modalClose = function () {
        $scope.modal.hide();
      };

      $scope.selectItem = function (item) {
        if ($scope.modal) {
          $scope.shownModal = 'billView';
          $scope.selectedItem = item;
          $scope.modal.show();
        }
      };

      $scope.clearSearch = function () {
        $scope.search.text = '';
      };

      $scope.$on('bill.modal.close', function () {
        $scope.modal.hide();
      });

      $scope.noMoreItemsAvailable = false;
      $scope.bills = [];
      var index = 6;
      $scope.loadMore = function () {
        setTimeout(function () {
          var startIndex = index - 6;
          for (var i = startIndex;i < index; i++)
          {
            if ($scope.bills.length != $scope.items.length)
              {$scope.bills.push($scope.items[i]);}
          }
          if ($scope.items.length > index)
            {index += 6;}
          $scope.$broadcast('scroll.infiniteScrollComplete');
          $ionicScrollDelegate.resize();
        }, 1000);
      };

    }]);
