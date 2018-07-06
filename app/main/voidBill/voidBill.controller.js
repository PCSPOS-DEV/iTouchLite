/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('VoidBillCtrl', ['$scope', 'VoidBillService', 'ControlService', 'Reciept', 'Alert', '$ionicModal', '$timeout', 'BillService', 'LogService',
    function ($scope, VoidBillService, ControlService, Reciept, Alert, $ionicModal, $timeout, BillService, LogService) {
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();
      var self = this;
      self.data = {
        bills: [],
        selectedItem: null
      };
      self.loading = true;

      $scope.$on('modal.shown', function (event, data) {
        if (data.id == 5) {
          refresh();
        }
      });

      var refresh = function () {
        self.loading = true;
        VoidBillService.getBillList(ControlService.getBusinessDate(true)).then(function (data) {
          self.data.bills = data;
        }).finally(function () {
          $timeout(function () {
            self.loading = false;
          }, 500);
        });
      };

      self.close = function () {
        $scope.$emit('voidBill.modal.close');
      };

      self.voidBill = function () {
        var bill = self.data.selectedItem;
        if (bill) {
          Alert.showConfirm('Are you sure?', 'Void bill', function (res) {
            if (res == 1) {
              eventLog.log('voidBill Start: ');
              BillService.voidOldBill();
              VoidBillService.voidBill(bill.DocNo).then(function (DocNo) {
                $scope.$emit('initBill');
                $scope.$emit('refresh-cart');
                $scope.$emit('voidBill.modal.close');
                Reciept.printVoid(DocNo);
                Reciept.openDrawer();
              }, function (ex) {
                // eventLog.log('setImages loadLogo Start: ');
                console.log(ex);
              });
              eventLog.log('voidBill Complete: ');
            }
          });
        } else {
          Alert.warning('Please select an item to void');
        }
        LogService.SaveLog();
      };

      self.onItemTap = function (bill) {
        if (bill) {
          eventLog.log('voidBill onItemTap : Start ');
          self.data.bills = _.map(self.data.bills, function (item) {
            item.active = false;
            return item;
          });
          bill.active = true;
          self.data.selectedItem = bill;
          eventLog.log('voidBill onItemTap : Finish ');
        }
        LogService.SaveLog();
      };

      self.view = function () {
        $scope.selectedItem = angular.copy(self.data.selectedItem);
        if ($scope.selectedItem) {
          self.modal.show();
          // self.data.selectedItem = null;
        }
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
        self.modal = modal;
      });

      /**
       * Manages the sub PLU modal close event
       */
      $scope.modalClose = function () {
        self.modal.hide();
        $scope.$emit('voidBill.modal.open');
      };

      $scope.$on('bill.modal.close', function () {
        errorLog.log('Bill Detail Model Close');
        self.modal.hide();
      });

      LogService.SaveLog();
    }]);
