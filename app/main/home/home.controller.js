/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("HomeCtrl", ['$log', 'ionicDatePicker', 'ControlService', '$ionicModal', '$scope', 'ShiftService', '$state', '$ionicHistory',
    function ($log, ionicDatePicker, ControlService, $ionicModal, $scope, ShiftService, $state, $ionicHistory) {
    var self = this;

    self.openSales = function(){
      $ionicHistory.nextViewOptions({
        disableAnimate: false,
        disableBack: true
      });

      $state.go('app.sales');

    }

  }]);
