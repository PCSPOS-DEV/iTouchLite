/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ShiftCtrl', ['$scope', 'ShiftService', '$ionicPopup', '$state', 'Report', '$q', '$ionicHistory', '$timeout', 'Alert', 'Reciept', 'CartItemService', 'ControlService', 'SuspendService',
    function ($scope, ShiftService, $ionicPopup, $state, Report, $q, $ionicHistory, $timeout, Alert, Reciept, CartItemService, ControlService, SuspendService) {
      $scope.shifts = [];
      $scope.shiftSelectionShown = true;
      $scope.shift = {};
      $scope.title = '';

      $scope.$on('modal.shown', function (event, modal) {
        $scope.shiftSelectionShown = true;
        if (modal.id == 3) {
          var promise = null;

          switch ($scope.shiftListType) {
            case 'open':
              $scope.title = 'Open Shift';
              promise = ShiftService.getUnOpened();
              // eventLog.log('Open Shift : Complete');
              break;
            case 'close':
              $scope.title = 'Close Shift';
              promise = ShiftService.getOpened();
              eventLog.log('Close Shift : Complete');
              break;
            case 'declareCash':
              $scope.title = 'Declare Cash';
              promise = ShiftService.getDeclareCashShifts();
              eventLog.log('Declare Cash : Complete');
              break;
            default:
              $scope.title = 'Exit Shift';
              promise = ShiftService.getOpened();
              eventLog.log('Exit Shift : Complete');
              break;
          }
          promise.then(function (shifts) {
            $scope.shifts = shifts;
          });
        }
      });


      $scope.selectShift = function (shift) {
        $scope.shift = shift;
        switch ($scope.shiftListType) {
          case 'open':
            if (shift.OpenDateTime) {
              eventLog.log('Shift Open Success : ' + shift.Description1 + ' ' + shift.Description2, 3);
              Alert.showLoading();
              ShiftService.saveCurrent(shift);
              $scope.$emit('shift-changed');
              $scope.$emit('shift-modal-close');
              $timeout(function () {
                $ionicHistory.nextViewOptions({
                  disableAnimate: false,
                  disableBack: true
                });
                $state.go('app.sales');
              }, 1000);
              // Alert.hideLoading();
            } else {
              $scope.shiftSelectionShown = false;
            }

            break;
          case 'close':
            closeShift($scope.shift);
            break;
          case 'declareCash':
            $scope.close();
            $timeout(function () {
              $scope.$emit('declare-cash', shift);
            }, 500);

            break;
          default:
            $ionicHistory.nextViewOptions({
              disableAnimate: false,
              disableBack: true
            });
            ShiftService.clearCurrent();
            $scope.$emit('shift-modal-close');
            $scope.$emit('shift-exit', shift);
            break;
        }
      };

      $scope.close = function () {
        $scope.$emit('shift-modal-close');
      };

      $scope.goBack = function () {
        $scope.shiftSelectionShown = true;
      };

      $scope.save = function () {
        Alert.showLoading();
        $q.all({
          save: ShiftService.saveCurrent($scope.shift),
          addFloat: ShiftService.addFloat($scope.shift, $scope.shift.RA)
        }).then(function () {
          Reciept.openDrawer();

          $scope.$emit('shift-changed');
          Report.printAddFloat($scope.shift.RA);
          $scope.$emit('shift-modal-close');

          $timeout(function () {
            $ionicHistory.nextViewOptions({
              disableAnimate: false,
              disableBack: true
            });
            $state.go('app.sales');
          }, 1000);

        }, function (err) {
          console.log(err);
        });
        // Alert.hideLoading();
        // $scope.$emit("shift-modal-close");
      };

      var closeShift = function (shift) {
        CartItemService.isEmpty().then(function (isEmpty) {
          if (isEmpty) {
            /*Alert.showConfirm('Are you sure you want to close this shift ('+shift.Id+')?', 'Close Shift?', function(res){
              if(res == 1){
              SuspendService.fetchSuspendedBills().then(function(data){
                console.log("SuspendService");
               console.log(data);
                if(data.length!=0){
                  Alert.warning('Shift cannot be closed since the system detects the suspend bills.');
                }
                else{
                ShiftService.closeShift(shift.Id || null).then(function(success){
                  //var businessDate = angular.copy(ControlService.getBusinessDate());
                  //Report.printShiftClosingReport(shift.Id, businessDate);
                  $scope.$emit("shift-close", shift);
                }, function(err){
                  console.log(err);
                });
               }
               });

              }
            });*/
            Alert.showConfirm('Are you sure you want to close this shift (' + shift.Id + ')?', 'Close Shift?', function (res) {
              if (res == 1) { // need to be comment to prevent alert
                ShiftService.closeShift(shift.Id || null).then(function (success) {
                  //var businessDate = angular.copy(ControlService.getBusinessDate());
                  //Report.printShiftClosingReport(shift.Id, businessDate);
                  $scope.$emit('shift-close', shift);
                }, function (err) {
                  errorLog.log('Shift closeShift : Error : ' + err, 3);
                  console.log(err);
                });
              }
            });
          } else {
            var info = 'Unsaved items should be saved before closing the shift';
            errorLog.log('Shift closeShift : Error : ' + info, 3);
            Alert.warning(info);
          }
        });


      };

    }]);
