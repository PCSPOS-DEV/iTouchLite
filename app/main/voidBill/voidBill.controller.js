/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('VoidBillCtrl', ['$scope', 'VoidBillService', 'ControlService', 'Reciept', 'Alert',
    function ($scope, VoidBillService, ControlService, Reciept, Alert) {
      var self = this;
      self.bills = {};

      $scope.$on('modal.shown', function(event, data){
        refresh();
      });

      var refresh = function () {
        if($scope.shownModal = 'voidBill'){
          VoidBillService.getBillList(ControlService.getBusinessDate(true)).then(function(data){
            self.bills = data;
          });
        }
      }

      self.close = function () {
        $scope.$emit('voidBill.modal.close');
      }

      self.voidBill = function(bill){
        Alert.showConfirm('Are you sure?', 'Void bill', function(res){
          if(res == 1){
            VoidBillService.voidBill(bill.DocNo).then(function(DocNo){
              $scope.$emit('initBill');
              $scope.$emit('voidBill.modal.close');
              Reciept.printVoid(DocNo);
            }, function(ex){
              console.log(ex);
            });
          }
        });
      }



    }]);
