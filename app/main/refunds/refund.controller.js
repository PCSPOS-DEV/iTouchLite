/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('RefundCtrl', ['$scope', 'ReasonService', 'BillService', 'Alert',
    function ($scope, ReasonService, BillService, Alert) {
      $scope.reasons = [];
      $scope.refund = {
      };

      $scope.$on('modal.shown', function(event, data){
        // handle event
        refresh();
      });

      var refresh = function () {
        ReasonService.get('R').then(function(reasons) {
          $scope.reasons = reasons;
        });
      }

      $scope.close = function () {
        $scope.clear();
        $scope.$emit('refundModal-close');
      }

      $scope.clear = function () {
        $scope.refund.reference = "";
      }

      $scope.save = function () {
        var item = $scope.cart.selectedItem;
        if(item){
          if($scope.refund.reason){
            BillService.refundItem(item.ItemId, item.LineNumber, $scope.refund.reason.Code, $scope.refund.reference).then(function () {
              $scope.clear();
              $scope.$emit('refundModal-close');
            }, function (err) {
              console.log(err);
            });
          } else {
            Alert.warning('Please select a reason before saving!');
          }

        }
      }

    }]);
