/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("SettingsCtrl", ['$scope', 'SettingsService', '$state', 'SyncService', function ($scope, SettingsService, $state, SyncService) {
    try {
      $scope.settings = {
        ent_id: SettingsService.getEntityId(),
        loc_id: SettingsService.getLocationId(),
        mac_id: SettingsService.getMachineId(),
        cash_id: SettingsService.getCashId()
      };
    } catch(ex){
      $scope.settings = {
        ent_id:  null,
        loc_id:  null,
        mac_id: null
      };
      console.log(ex);
    }

    $scope.save = function () {
      SettingsService.setEntityId($scope.settings.ent_id);
      SettingsService.setLocationId($scope.settings.loc_id);
      SettingsService.setMachineId($scope.settings.mac_id);
      SettingsService.setCashId($scope.settings.cash_id);
      SettingsService.save();

      SyncService.do();

      $state.go('login');
    }

  }]);
