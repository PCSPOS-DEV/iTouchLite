/**
 * Created by Lynn
 */
angular.module('itouch.controllers')
  .controller('BillDiscountsCtrl', ['Alert', '$localStorage', '$scope', '$rootScope', 'SettingsService', '$state', 'BillService',
    function (Alert, $localStorage, $scope, $rootScope, SettingsService, $state, BillService) {
      var self = this;
      $scope.fitem = BillService.fetchBillData();
      console.log(BillService.fetchBillData())

      // $scope.BD = item.BusinessDate;
      // console.log( $scope.newlogs);

      self.Back2Logs = function () {
        $state.go('app.admin');
      };


    }]);
