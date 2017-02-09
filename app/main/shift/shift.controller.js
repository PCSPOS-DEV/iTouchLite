/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ShiftCtrl', ['$scope', 'ShiftService', '$ionicPopup', '$state', 'Report', '$q',
    function ($scope, ShiftService, $ionicPopup, $state, Report, $q) {
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
            $scope.shiftSelectionShown = false;
            break;
          case 'close':
            closeShift($scope.shift);
            break;
          case 'declareCash':
            $scope.close();
            $scope.closeShiftOptionsModal();
            $scope.$emit("declare-cash", shift);
            break;
          default:
            // $scope.$emit("shift-modal-close");
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
          $scope.close();
          $scope.$emit('shift-changed');
          $scope.closeShiftOptionsModal();
          Report.printAddFloat($scope.shift.RA);
        }, function(err){
          console.log(err);
        });
        // $scope.$emit("shift-modal-close");
      }

      var closeShift = function(shift){
        var confirmPopup = $ionicPopup.confirm({
          title: 'Close Shift?',
          template: 'Are you sure you want to close this shift ('+shift.Id+')?'
        });

        confirmPopup.then(function(res) {
          if(res) {
            ShiftService.closeShift(shift.Id || null).then(function(success){
              $scope.$emit("shift-close", shift);
              console.log(success);
            }, function(err){
              console.log(err);
            });
          }
        });
      }

    }]);
