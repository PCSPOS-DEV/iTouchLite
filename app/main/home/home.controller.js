/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("HomeCtrl", ['$log', 'ionicDatePicker', 'ControlService', '$ionicModal', '$scope', 'ShiftService', '$state', '$ionicHistory',
    function ($log, ionicDatePicker, ControlService, $ionicModal, $scope, ShiftService, $state, $ionicHistory) {
    var self = this;

    self.shift = ShiftService.getCurrent();


    self.openSales = function(){
      var ready = true;
      if(ControlService.isNewBusinessDate()){
        ready = false;
        self.openDatePicker();
      }

      if(!self.shift){
        ready = false;
        self.shiftOptionsModal.show();
      }

      if(ready){
        $ionicHistory.nextViewOptions({
          disableAnimate: false,
          disableBack: true
        });
        $state.go('app.sales');
      }

    }

    /**
     * Opens the Business Date picker
     */
    self.openDatePicker = function () {
      var datePickerOptions = {
        callback: function (val) {
          setBusinessDate(new Date(val));
          self.openSales();
        },
        inputDate: ControlService.getNextBusinessDate().isValid() ? ControlService.getNextBusinessDate().toDate() : new Date(),
        setLabel: 'Set Bu. Date',
        showTodayButton: true
      };

      ionicDatePicker.openDatePicker(datePickerOptions);
    };

    /**
     * Initiating shift modal dialog
     */
    $ionicModal.fromTemplateUrl('main/shift/shiftOptions.html', {
      scope: $scope,
      backdropClickToClose: false,
      animation: 'slide-in-up'
    }).then(function (modal) {
      self.shiftOptionsModal = modal;
    });

    /**
     * Biding an event to catch modal close call
     */
    $scope.closeShiftOptionsModal = function () {
      self.shiftOptionsModal.hide();
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
