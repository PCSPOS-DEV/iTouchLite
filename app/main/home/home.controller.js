/**
 * Created by shalitha on 17/5/16.
 */
'use strict';
angular.module('itouch.controllers')
  .controller('HomeCtrl', ['$log', 'ionicDatePicker', 'ControlService', '$ionicModal', '$scope', 'ShiftService', '$state', '$ionicHistory',
    function ($log, ionicDatePicker, ControlService, $ionicModal, $scope, ShiftService, $state, $ionicHistory) {
      var self = this;

      self.openSales = function () {
        $ionicHistory.nextViewOptions({
          disableAnimate: false,
          disableBack: true
        });

        $scope.setImages();

        $state.go('app.sales');

      };

    }]);
