/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('RecallSuspendedBillCtrl', ['$scope', 'SuspendService', 'ControlService', 'Reciept', 'Alert', '$ionicModal', '$timeout',
    function ($scope, SuspendService, ControlService, Reciept, Alert, $ionicModal, $timeout) {
      var self = this;
      self.data = {
        bills: [],
        selectedItem: null
      };
      self.loading = true;

      $scope.$on('modal.shown', function (event, data) {
        if (data.id == 14) {
          refresh();
        }
      });

      var refresh = function () {
        self.loading = true;
        SuspendService.fetchSuspendedBills().then(function (data) {
          self.data.bills = data;
        }).finally(function () {
          $timeout(function () {
            self.loading = false;
          }, 500);

        });
      };

      self.close = function () {
        $scope.$emit('recallSuspendBill.modal.close');
      };

      self.recallBill = function () {
        var bill = self.data.selectedItem;
        if (bill) {
          // Alert.showConfirm('Are you sure?', 'Recall Suspended bill', function (res) {
          //   if (res == 1) {
              SuspendService.recallBill(bill.DocNo).then(function (DocNo) {
                $scope.$emit('initBill');
                $scope.$emit('refresh-cart');
                $scope.$emit('recallSuspendBill.modal.close');
                // Reciept.printVoid(DocNo);
              }, function (ex) {
                console.log(ex);
              });
          //   }
          // });
        } else {
          //Alert.warning('Please select an item to void');
          Alert.warning('Please select an item to suspend', 'ItouchLite');
        }

      };

      $timeout(self.onItemTap = function (bill) {
        if (bill) {
          self.data.bills = _.map(self.data.bills, function (item) {
            item.active = false;
            return item;
          });
          bill.active = true;
          self.data.selectedItem = bill;
        }

      });

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
     /* $ionicModal.fromTemplateUrl('main/history/billModal.html', {
        id: 6,
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        self.modal = modal;
      });*/

      /**
       * Manages the sub PLU modal close event
       */
      /*$scope.modalClose = function () {
        self.modal.hide();
        $scope.$emit('voidBill.modal.open');
      }

      $scope.$on('bill.modal.close', function () {
        self.modal.hide();
      });*/
      /* Yi Yi Po*/
      $ionicModal.fromTemplateUrl('main/recallSuspendedBill/billSuspendModal.html', {
        id: 6,
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        self.modal = modal;
      });
      $scope.$on('bill.modal.close', function () {
        self.modal.hide();
      });
      /*---*/

    }]);
