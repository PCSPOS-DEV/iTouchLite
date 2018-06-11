/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ShiftOptionsCtrl', ['$scope', 'ShiftService', '$ionicModal', '$ionicPopup', '$state', 'Alert', '$q', '$ionicHistory', 'CartItemService', 'Report', 'BillService', 'shiftData', '$cordovaDialogs', 'ionicDatePicker', 'ControlService',
   '$timeout', 'Reciept', 'UploadService', 'SuspendService', 
    function ($scope, ShiftService, $ionicModal, $ionicPopup, $state, Alert, $q, $ionicHistory, CartItemService, Report, BillService, shiftData, $cordovaDialogs, ionicDatePicker, ControlService, $timeout, Reciept, UploadService, SuspendService) {
      var self = this;
      var dayEnd = false;
      var suspenditem = 0;
      var ask = 0;
      var shiftLog = ShiftService.StartShiftLog();
      var BDate = moment(angular.copy(ControlService.getDayEndDate())).format('DD-MM-YYYY');
      var systemDate = new Date();
      var tDay= new Date();
      tDay.setDate(systemDate.getDate() + 1); 

      $scope.shiftListType = null;
      self.shiftData = shiftData;

      var checkBDate = function () {
        if (ControlService.isNewBusinessDate()) {
          if ((ControlService.getDayEndDate()) == undefined) {
            self.openDatePicker(ControlService.getDayEndDate());
            return false;
          }
          else if ((ControlService.getDayEndDate()).format('DD-MM-YYYY') >= moment(tDay).format('DD-MM-YYYY')) {
            Alert.error('Invalid Business Date.');
          } else {
            self.openDatePicker(ControlService.getDayEndDate());
            return false;
          }
        } else {
          return true;
        }
      };

      $scope.$on('$ionicView.enter', function (event, data) {
        checkBDate();
      });


      var refreshData = function () {
        $q.all({
          opened: ShiftService.getOpened(),
          unOpened: ShiftService.getUnOpened(),
          toBeDeclared: ShiftService.getDeclareCashShifts(),
          dayEndPossible: ShiftService.dayEndPossible()
        }).then(function (data) {
          self.shiftData = data;
        }, function (ex) {
          console.log(ex);
        });
      };

      $scope.$on('shift-changed', function () {
        refreshData();
      });
      /**
       * Initiating shift modal dialog
       */
      $ionicModal.fromTemplateUrl('main/shift/selectShift.html', {
        id: 3,
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        self.shiftModal = modal;
      });

      self.openShiftOpenModal = function () {
        if (checkBDate()) {
          shiftLog.log('New Business Date (' + BDate + ')', 3);
          $scope.shiftListType = 'open';
          self.shiftModal.show();
        } else {
          shiftLog.log('Open Shift Warning : Choose business date first', 3);
          Alert.warning('Choose business date first!');
        }
      };

      self.openShiftCloseModal = function () {
        SuspendService.fetchSuspendedBills().then(function (data) {
          suspenditem = parseInt(data.length);
          if (suspenditem == 0) { // GGWP
            $scope.shiftListType = 'close';
            self.shiftModal.show();
          } else {
            Alert.warning('Suspend Item is not empty.', 'ItouchLite');
          }
        });

      };

      self.openShiftExitModal = function () {
        Alert.showConfirm('Are you sure?', 'Exit current shift', function (val) {
          if (val == 1) {
            dayEnd = false;
            ShiftService.clearCurrent();
            showReopenModal();
            shiftLog.log('Shift Exit : Success', 3);
          }
        });
      };

      self.openDeclareCash = function () {
        $scope.shiftListType = 'declareCash';
        self.shiftModal.show();
      };

      var showReopenModal = function () {
        if (!dayEnd) {
          ShiftService.getOpened().then(function (data) {
            if (data.length == 0) {
              // Alert.warning('No shifts available');
            } else {
              $timeout(function () {
                self.openShiftOpenModal();
              }, 1000);
            }
          });
        } else {
          self.openDayEnd();
        }
      };

      var openCashPopUp = function (shift, dayEnd) {
        Reciept.openDrawer();
        Reciept.printSignal();
        setTimeout(function () {
          $scope.data = {};
          var buttons = [
            {
              text: '<b>Ok</b>',
              type: 'button-positive',
              onTap: function (e) {
                if ($scope.data.cash && !_.isNaN($scope.data.cash)) {
                  shiftLog.log('Declare Cash Info : Entered value (' + $scope.data.cash + ')', 3);
                  return $scope.data.cash;
                } else {
                  e.preventDefault();
                  shiftLog.log('Declare Cash Error : Entered value is invalid!', 3);
                  Alert.warning('Entered value is invalid!');
                }
              }
            }
          ];

          if (!dayEnd) {
            buttons.push({
              text: 'Later',
              onTap: function (e) {
                return 'later';
              }
            });
          }

          // An elaborate, custom popup
          var myPopup = $ionicPopup.show({
            template: '<input type="number" ng-model="data.cash">',
            title: 'Declare Cash',
            // subTitle: 'Please use normal things',
            scope: $scope,
            buttons: buttons
          });

          myPopup.then(function (cash) {
            var promise = null;
            if (cash == 'later') {

              ShiftService.declareCashLater(shift.Id).then(function () {
                refreshData();
                self.shiftModal.hide();
                showReopenModal();
              }, function (err) {
                shiftLog.log('Popup Error :' + err, 3);
                console.log(err);
              });
            } else {
              ShiftService.declareCash(cash, shift.Id).then(function (DocNo) {
                if(cash && !_.isNaN(cash)){
                self.shiftModal.hide();
                Report.printDeclareCash(shift, cash);
                refreshData();

                Report.printShiftClosingReport(shift.Id);

                showReopenModal();
                } else {
                  shiftLog.log('Declare Cash Error : Entered value is invalid!', 3);
                  Alert.warning('Entered value is invalid!');
                }

              }, function (err) {
                shiftLog.log('Declare Cash Error :' + err, 3);
                console.log(err);
              });
            }
            // console.log('Tapped!', res);
          });
        }, 500);
      };

      /**
       * Biding an event to catch modal close call
       */
      self.closeShiftModal = function () {
        self.shiftModal.hide();
      };

      $scope.$on('declare-cash', function (evt, shift) {
        openCashPopUp(shift, dayEnd);
      });

      $scope.$on('shift-close', function (evt, shift) {
        shiftLog.log('Close Shift Success : ' + shift.Description1 + ' ' + shift.Description2, 3);
        openCashPopUp(shift, dayEnd);
      });

      $scope.$on('shift-modal-close', function (evt, success) {
        // if(!dayEnd){
        self.closeShiftModal();
        // }
      });

      $scope.flag = false;
      self.openDayEnd = function() {
        if (ask == 0) { 
          Alert.showConfirm('Are you sure you want to day end closing ?', 'Day End Close?', function (res) {
            if (res == 1) {
              shiftclosingReport();
            }
          });
          ask = 1;
        } else {
          shiftclosingReport();
        }
        
      }

      var shiftclosingReport = function () {
        $scope.flag = true;
        $q.all({
          declare: ShiftService.getDeclareCashShifts(),
          opened: ShiftService.getOpened(),
          cartEmpty: CartItemService.isEmpty()
        }).then(function (data) {
          if (!data.cartEmpty) {
            // if(!dayEnd) {
              dayEnd = true;
              shiftLog.log('Day End Error : Unsaved items should be saved before day end', 3);
              Alert.warning('Unsaved items should be saved before day end');
            // }
            return true;
          }

          if (data.declare.length > 0) {
            // if(!dayEnd){
              dayEnd = true;
              shiftLog.log('Day End Error : Declare Cash before day end', 3);
              Alert.warning('Declare Cash before day end');
            // }

            // self.openDeclareCash();
            return true;
          }

          if (data.opened.length > 0) {
            // if(!dayEnd){
              shiftLog.log('Day End Error : Close shifts before day end', 3);
              Alert.warning('Close shifts before day end');
              dayEnd = true;
            // }

            // self.openShiftCloseModal();
            return true;
          }
          var businessDate = angular.copy(ControlService.getBusinessDate());
          $timeout(function () {
            Report.printShiftClosingReport(null, businessDate);
          }, 100);
          $timeout(function () {
            ShiftService.dayEnd().then(function () {
              dayEnd = false;
              $scope.$emit('shift-changed');
              shiftLog.log('Day End Success : Busineess Date ('+ moment(businessDate).format('DD-MM-YYYY') + ')', 3);
              shiftLog.log('-----*-----*-----', 3);
              Alert.success('Day end completed');
              $ionicHistory.nextViewOptions({
                disableAnimate: false,
                disableBack: true
              });
              UploadService.upload().finally(function () {
                $state.go('app.home');
              });

            }, function (err) {
              dayEnd = false;
              console.log(err);
            });
          }, 200);
        });
      }

      /**
       * Opens the Business Date picker
       */
      self.openDatePicker = function (currentDate) {
        var datePickerOptions = {
          callback: function (val) {
            setBusinessDate(new Date(val));
          },
          inputDate: ControlService.getNextBusinessDate().isValid() ? ControlService.getNextBusinessDate().toDate() : new Date(),
          setLabel: 'Set Bu. Date',
          // showTodayButton: true,
          from: currentDate && currentDate.isValid() ? currentDate.add(1, 'days').toDate() : moment().toDate(),
          to: tDay,
          showTodayButton: false,
        };

        ionicDatePicker.openDatePicker(datePickerOptions);
      };


      /**
       * Saves the Business Date set by the user
       * @param date
       */
      var setBusinessDate = function (date) {
        if (moment(date).isValid()) {
          ControlService.setBusinessDate(moment(date));
        } else {
          $log.log('date is not valid');
        }

      };

      self.test = function () {
        var bdate = ControlService.getNextBusinessDate();
        bdate.subtract(1, 'days');
        Report.printShiftClosingReport(null, bdate);
      };

    }]);
