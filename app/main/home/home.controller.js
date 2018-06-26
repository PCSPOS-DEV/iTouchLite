/**
 * Created by shalitha on 17/5/16.
 */

angular.module('itouch.controllers')
  .controller('HomeCtrl', ['ionicDatePicker', 'ControlService', '$ionicModal', '$scope', 'ShiftService', '$state', '$ionicHistory',
    function (ionicDatePicker, ControlService, $ionicModal, $scope, ShiftService, $state, $ionicHistory) {
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
