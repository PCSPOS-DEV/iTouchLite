/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ShiftOptionsCtrl', ['$scope', 'ShiftService', '$ionicModal', '$ionicPopup', '$state', 'Alert', '$q', '$ionicHistory', 'CartItemService', 'Report', 'BillService', 'shiftData', '$cordovaDialogs', 'ionicDatePicker', 'ControlService',
    '$timeout', 'Reciept', 'UploadService', 'SuspendService', 'SettingsService', 'AppConfig', '$http', 'LogService',
    function ($scope, ShiftService, $ionicModal, $ionicPopup, $state, Alert, $q, $ionicHistory, CartItemService, Report, BillService, shiftData, $cordovaDialogs, ionicDatePicker, ControlService,
      $timeout, Reciept, UploadService, SuspendService, SettingsService, AppConfig, $http, LogService) {
      var self = this;
      var dayEnd = false;
      var suspenditem = 0;
      var ask = 0;
      var BDate = moment(angular.copy(ControlService.getDayEndDate())).format('DD-MM-YYYY');
      var systemDate = new Date();
      var tDay = new Date();
      tDay.setDate(systemDate.getDate() + 1);
      $scope.shiftListType = null;
      self.shiftData = shiftData;
      var businessDate = angular.copy(ControlService.getBusinessDate());

      var checkBDate = function () {
        if (ControlService.isNewBusinessDate()) {
          eventLog.log('checkBDate : Start');
          if ((ControlService.getDayEndDate()) == undefined) {
            self.openDatePicker(ControlService.getDayEndDate());
            eventLog.log('BDate :' + ControlService.getDayEndDate());
            return false;
          }
          else if ((ControlService.getDayEndDate()).format('YYYY-MM-DD') >= moment(tDay).format('YYYY-MM-DD')) {
            // else if ((ControlService.getDayEndDate()).format('DD-MM-YYYY') >= moment(tDay).format('DD-MM-YYYY')) {
            eventLog.log('Invalid Business Date.');
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
        eventLog.log('shift-changed');
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
        eventLog.log('Open Shift : Start');
        if (checkBDate()) {
          $scope.shiftListType = 'open';
          self.shiftModal.show();
        } else {
          Alert.warning('Choose business date first!');
        }
      };

      self.openShiftCloseModal = function () {
        eventLog.log('Close Shift : Start');
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
          eventLog.log('Exit Shift : Start');
          if (val == 1) {
            dayEnd = false;
            ShiftService.clearCurrent();
            showReopenModal();
          }
        });
      };

      self.openDeclareCash = function () {
        eventLog.log('Declare Cash : Start');
        $scope.shiftListType = 'declareCash';
        self.shiftModal.show();
      };

      self.postlog = function () {
        $scope.PostLog();
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
                  return $scope.data.cash;
                } else {
                  e.preventDefault();
                  errorLog.log('Cash Pop-up : Entered value is invalid');
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
                console.log(err);
              });
            } else {
              ShiftService.declareCash(cash, shift.Id).then(function (DocNo) {
                if (cash && !_.isNaN(cash)) {
                  self.shiftModal.hide();
                  Report.printDeclareCash(shift, cash);
                  refreshData();

                  Report.printShiftClosingReport(shift.Id);

                  showReopenModal();
                } else {
                  errorLog.log('Cash Pop-up : Entered value is invalid');
                  Alert.warning('Entered value is invalid!');
                }

              }, function (err) {
                errorLog.log('Cash Pop-up Error: ' + error);
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
        openCashPopUp(shift, dayEnd);
      });

      $scope.$on('shift-modal-close', function (evt, success) {
        // if(!dayEnd){
        self.closeShiftModal();
        // }
      });

      $scope.PostLog = function () {
        LogService.PostLogData(); // Sync Log
      };

      var shiftclosingReport = function () {
        eventLog.log('Day End Closing : Start');
        $scope.flag = true;
        $q.all({
          declare: ShiftService.getDeclareCashShifts(),
          opened: ShiftService.getOpened(),
          cartEmpty: CartItemService.isEmpty()
        }).then(function (data) {
          if (!data.cartEmpty) {
            // if(!dayEnd) {
            dayEnd = true;
            eventLog.log('Day End Closing : Unsaved items should be saved before day end');
            Alert.warning('Unsaved items should be saved before day end');
            // }
            return true;
          }

          if (data.declare.length > 0) {
            // if(!dayEnd){
            dayEnd = true;
            eventLog.log('Day End Closing : Declare Cash before day end');
            Alert.warning('Declare Cash before day end');
            // }

            // self.openDeclareCash();
            return true;
          }

          if (data.opened.length > 0) {
            // if(!dayEnd){
            eventLog.log('Day End Closing : Close shifts before day end');
            Alert.warning('Close shifts before day end');
            dayEnd = true;
            // }

            // self.openShiftCloseModal();
            return true;
          }

          $timeout(function () {
            Report.printShiftClosingReport(null, businessDate);
          }, 100);
          $timeout(function () {
            ShiftService.dayEnd().then(function () {
              dayEnd = false;
              $scope.$emit('shift-changed');
              $scope.PostLog();
              eventLog.log('Day End Closing : Completed');
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
      };

      $scope.flag = false;
      self.openDayEnd = function () {
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

      };

      /**
       * Saves the Business Date set by the user
       * @param date
       */
      var setBusinessDate = function (date) {
        if (moment(date).isValid()) {
          eventLog.log('Set Business Date : ' + moment(date).format('YYYY-MM-DD'));
          ControlService.setBusinessDate(moment(date));
        } else {
          errorLog.log('date is not valid');
          console.log('date is not valid');
        }
      };

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

      self.test = function () {
        var bdate = ControlService.getNextBusinessDate();
        bdate.subtract(1, 'days');
        Report.printShiftClosingReport(null, bdate);
      };

    }]);
