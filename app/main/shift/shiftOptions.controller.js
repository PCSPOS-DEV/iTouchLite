/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ShiftOptionsCtrl', ['$scope', 'ShiftService', '$ionicModal', '$ionicPopup', '$state', 'Alert', '$q', '$ionicHistory', 'CartItemService', 'Report', 'BillService', 'shiftData', '$cordovaDialogs', 'ionicDatePicker', 'ControlService','$timeout',
    function ($scope, ShiftService, $ionicModal, $ionicPopup, $state, Alert, $q, $ionicHistory, CartItemService, Report, BillService, shiftData, $cordovaDialogs, ionicDatePicker, ControlService, $timeout) {
      var self = this;
      var dayEnd = false;

      $scope.shiftListType = null;
      self.shiftData = shiftData;

      var checkBDate = function(){
        if(ControlService.isNewBusinessDate()){
          self.openDatePicker(ControlService.getDayEndDate());
          return false;
        } else {
          return true;
        }
      }

      $scope.$on("$ionicView.enter", function(event, data){
        checkBDate();
      });

      $scope.$on('shift-changed', function(){
        refreshData();
      });

      var refreshData = function(){
        $q.all({
          opened: ShiftService.getOpened(),
          unOpened: ShiftService.getUnOpened(),
          toBeDeclared: ShiftService.getDeclareCashShifts(),
          dayEndPossible: ShiftService.dayEndPossible()
        }).then(function(data){
          self.shiftData = data;
        }, function(ex){
          console.log(ex);
        });
      }


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

      self.openShiftOpenModal = function(){
        if(checkBDate()){
          $scope.shiftListType = 'open';
          self.shiftModal.show();
        } else {
          Alert.warning('Choose business date first!');
        }
      }

      self.openShiftCloseModal = function(){
        $scope.shiftListType = 'close';
        self.shiftModal.show();
      }

      self.openShiftExitModal = function(){
        Alert.showConfirm('Are you sure?', 'Exit current shift', function(val){
          if(val == 1){
            ShiftService.clearCurrent();
            showReopenModal();
          }
        });
      }

      self.openDeclareCash = function(){
        $scope.shiftListType = 'declareCash';
        self.shiftModal.show();
      }

      var showReopenModal = function(){
        if(!dayEnd){
          ShiftService.getOpened().then(function(data){
            if(data.length == 0){
              Alert.warning('No shifts available');
            } else {
              $timeout(function(){
                self.openShiftOpenModal();
              }, 1000);
            }
          });
        } else {
          self.openDayEnd();
        }
      }

      var openCashPopUp = function(shift, dayEnd){
        $scope.data = {};
        var buttons = [
          {
            text: '<b>Ok</b>',
            type: 'button-positive',
            onTap: function(e) {
              if($scope.data.cash && !_.isNaN($scope.data.cash)){
                return $scope.data.cash;
              } else {
                e.preventDefault();
                Alert.warning('Entered value is invalid!');
              }
            }
          }
        ];

        if(!dayEnd){
          buttons.push({
            text: 'Later',
            onTap: function(e) {
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

        myPopup.then(function(cash) {
          console.log(shift);
          var promise = null;
          if(cash == 'later'){

            ShiftService.declareCashLater(shift.Id).then(function(){
              refreshData();
              self.shiftModal.hide();
              showReopenModal();
            }, function(err){
              console.log(err);
            });
          } else {
            ShiftService.declareCash(cash, shift.Id).then(function(DocNo){
              // if(cash && !_.isNaN(cash)){
                self.shiftModal.hide();
                Report.printDeclareCash(shift, cash);
                refreshData();

                Report.printShiftClosingReport(shift.Id);

                showReopenModal();
              // } else {
              //   Alert.warning('Entered value is invalid!');
              // }

            }, function(err){
              console.log(err);
            });
          }
          // console.log('Tapped!', res);
        });
      }

      /**
       * Biding an event to catch modal close call
       */
      self.closeShiftModal = function () {
        self.shiftModal.hide();
      };

      $scope.$on('declare-cash', function(evt, shift){
        openCashPopUp(shift, dayEnd);
      });

      $scope.$on('shift-close', function(evt, shift){
        openCashPopUp(shift, dayEnd);
      });

      $scope.$on('shift-modal-close', function(evt, success){
        // if(!dayEnd){
          self.closeShiftModal();
        // }
      });

      self.openDayEnd = function() {
        $q.all({
          declare: ShiftService.getDeclareCashShifts(),
          opened: ShiftService.getOpened(),
          cartEmpty: CartItemService.isEmpty()
        }).then(function (data) {
          if (!data.cartEmpty) {
            // if(!dayEnd) {
              dayEnd = true;
              Alert.warning('Unsaved items should be saved before day end');
            // }
            return true;
          }

          if (data.declare.length > 0) {
            // if(!dayEnd){
              dayEnd = true;
              Alert.warning('Declare Cash before day end');
            // }

            // self.openDeclareCash();
            return true;
          }

          if (data.opened.length > 0) {
            // if(!dayEnd){
              Alert.warning('Close shifts before day end');
              dayEnd = true;
            // }

            // self.openShiftCloseModal();
            return true;
          }

          var businessDate = angular.copy(ControlService.getBusinessDate());
          ShiftService.dayEnd().then(function () {
            dayEnd = false;
            $scope.$emit('shift-changed');
            Report.printShiftClosingReport(null, businessDate);
            Alert.success('Day end completed')
            $ionicHistory.nextViewOptions({
              disableAnimate: false,
              disableBack: true
            });
            $state.go('app.home');

          }, function (err) {
            dayEnd = false;
            console.log(err);
          });
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
          showTodayButton: true,
          from: currentDate && currentDate.isValid()? currentDate.add(1, 'days').toDate(): moment().toDate(),
          showTodayButton: false
        };

        ionicDatePicker.openDatePicker(datePickerOptions);
      };




      /**
       * Saves the Business Date set by the user
       * @param date
       */
      var setBusinessDate = function (date) {
        if(moment(date).isValid()){
          ControlService.setBusinessDate(moment(date));
        } else {
          $log.log('date is not valid');
        }

      }

    }]);
