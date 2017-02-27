/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ShiftCtrl', ['$scope', 'ShiftService', '$ionicPopup', '$state', 'Report', '$q', '$ionicHistory', '$timeout', 'Alert',
    function ($scope, ShiftService, $ionicPopup, $state, Report, $q, $ionicHistory, $timeout, Alert) {
      $scope.shifts = [];
      $scope.shiftSelectionShown = true;
      $scope.shift = {};
      $scope.title = '';

      $scope.$on('modal.shown', function(event, modal) {
        $scope.shiftSelectionShown = true;
        if(modal.id == 3){
          var promise = null;

          switch($scope.shiftListType){
            case 'open':
              $scope.title = 'Open Shift';
              promise = ShiftService.getUnOpened();
              break;
            case 'close':
              $scope.title = 'Close Shift';
              promise = ShiftService.getOpened();
              break;
            case 'declareCash':
              $scope.title = 'Declare Cash';
              promise = ShiftService.getDeclareCashShifts();
              break;
            default:
              $scope.title = 'Exit Shift';
              promise = ShiftService.getOpened();
              break;
          }
          promise.then(function(shifts) {
            $scope.shifts = shifts;
          });
        }
      });


      $scope.selectShift = function (shift) {
        $scope.shift = shift;
        switch($scope.shiftListType){
          case 'open':
            if(shift.OpenDateTime){
              ShiftService.saveCurrent(shift);
              $scope.$emit('shift-changed');
              $scope.$emit("shift-modal-close");
              $timeout(function(){
                $ionicHistory.nextViewOptions({
                  disableAnimate: false,
                  disableBack: true
                });
                $state.go('app.sales');
              }, 1000);
            } else {
              $scope.shiftSelectionShown = false;
            }

            break;
          case 'close':
            closeShift($scope.shift);
            break;
          case 'declareCash':
            $scope.close();
            $timeout(function(){
              $scope.$emit("declare-cash", shift);
            }, 500);

            break;
          default:
            $ionicHistory.nextViewOptions({
              disableAnimate: false,
              disableBack: true
            });
            ShiftService.clearCurrent();
            $scope.$emit("shift-modal-close");
            $scope.$emit("shift-exit", shift);
            break;
        }
      }

      $scope.close = function(){
        $scope.$emit("shift-modal-close");
      }

      $scope.goBack = function () {
        $scope.shiftSelectionShown = true;
      }

      $scope.save = function () {
        $q.all({
          save: ShiftService.saveCurrent($scope.shift),
          addFloat: ShiftService.addFloat($scope.shift, $scope.shift.RA)
        }).then(function(){

          $scope.$emit('shift-changed');
          Report.printAddFloat($scope.shift.RA);
          $scope.$emit("shift-modal-close");

          $timeout(function(){
            $ionicHistory.nextViewOptions({
              disableAnimate: false,
              disableBack: true
            });
            $state.go('app.sales');
          }, 1000);

        }, function(err){
          console.log(err);
        });
        // $scope.$emit("shift-modal-close");
      }

      var closeShift = function(shift){
        Alert.showConfirm('Are you sure you want to close this shift ('+shift.Id+')?', 'Close Shift?', function(res){
          if(res == 1){
            ShiftService.closeShift(shift.Id || null).then(function(success){
              $scope.$emit("shift-close", shift);
            }, function(err){
              console.log(err);
            });
          }
        });
      }

    }]);
