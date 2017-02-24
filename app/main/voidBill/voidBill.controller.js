/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('VoidBillCtrl', ['$scope', 'VoidBillService', 'ControlService', 'Reciept', 'CartItemService', '$q',
    function ($scope, VoidBillService, ControlService, Reciept, CartItemService, $q) {
      var self = this;
      self.bills = {};

      $scope.$on('modal.shown', function(event, data){
        if($scope.shownModal = 'voidBill'){
          VoidBillService.getBillList(ControlService.getBusinessDate(true)).then(function(data){
            self.bills = data;
          });
        }
      });

      var refresh = function () {
        if($scope.type){
          self.title = $scope.type == 'F' ? 'Food Modifiers' : 'Drink Modifiers';
          ModifierService.get($scope.type == 'F' ? 'F' : 'B').then(function(modifiers) {
            angular.forEach(modifiers, function(row){
              if(!self.pages[row.PageNo]){
                self.pages[row.PageNo] = {};
              }
              for(var i = 1; i <= 32; i++){
                var key = _.findWhere(modifiers, { PageNo: row.PageNo, KeyNo: i });
                // console.log(key, i);
                // if(key){
                self.pages[row.PageNo][i] = key ? key : {};
                // }
              }
            });
            self.selectPage(self.pages[_.first(_.keys(self.pages))]);
          }, function(err){
            console.log(err);
          });
        }
      }

      self.close = function () {
        $scope.$emit('voidBill.modal.close');
      }

      self.voidBill = function(bill){
        VoidBillService.voidBill(bill.DocNo).then(function(DocNo){
          $scope.$emit('initBill');
          $scope.$emit('voidBill.modal.close');
          Reciept.printVoid(DocNo);
        }, function(ex){
          console.log(ex);
        });
      }



    }]);
