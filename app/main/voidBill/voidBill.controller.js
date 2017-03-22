/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('VoidBillCtrl', ['$scope', 'VoidBillService', 'ControlService', 'Reciept', 'Alert', '$ionicModal', '$timeout',
    function ($scope, VoidBillService, ControlService, Reciept, Alert, $ionicModal, $timeout) {
      var self = this;
      self.data = {
        bills: [],
        selectedItem: null
      };

      $scope.$on('modal.shown', function(event, data){
        if(data.id == 5){
          refresh();
        }
      });

      var refresh = function () {
        VoidBillService.getBillList(ControlService.getBusinessDate(true)).then(function(data){
          self.data.bills = data;
        });
      }

      self.close = function () {
        $scope.$emit('voidBill.modal.close');
      }

      self.voidBill = function(){
        var bill = self.data.selectedItem;
        if(bill){
          Alert.showConfirm('Are you sure?', 'Void bill', function(res){
            if(res == 1){
              VoidBillService.voidBill(bill.DocNo).then(function(DocNo){
                $scope.$emit('initBill');
                $scope.$emit("refresh-cart");
                $scope.$emit('voidBill.modal.close');
                Reciept.printVoid(DocNo);
              }, function(ex){
                console.log(ex);
              });
            }
          });
        } else {
          Alert.warning('Please select an item to void');
        }

      }

      self.onItemTap = function (bill) {
        if(bill){
          self.data.bills = _.map(self.data.bills, function(item){
            item.active = false;
            return item;
          });
          bill.active = true;
          self.data.selectedItem = bill;
        }

      }

      self.view = function(){
        $scope.selectedItem = angular.copy(self.data.selectedItem);
        if($scope.selectedItem){
          self.modal.show();
          // self.data.selectedItem = null;
        }
      }

      /**
       * Initiating Sub PLU modal dialog
       */
      $ionicModal.fromTemplateUrl('main/history/billModal.html', {
        id: 6,
        scope: $scope,
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
      }

      $scope.$on('bill.modal.close', function () {
        self.modal.hide();
      });



    }]);
