/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("GeneralSettingsCtrl", ['$scope', 'SettingsService', '$state', 'SyncService', 'AppConfig', 'Restangular', function ($scope, SettingsService, $state, SyncService, AppConfig, Restangular) {
    var self = this;

    $scope.$on('viewOpen', function(event, data){
      if(data == 'general'){
        $scope.loadingHide();
        refresh();
      }
    });

    var refresh = function () {
      try {
        self.settings = {
          ent_id: SettingsService.getEntityId(),
          loc_id: SettingsService.getLocationId(),
          mac_id: SettingsService.getMachineId(),
          cash_id: SettingsService.getCashId(),
          url: AppConfig.getBaseUrl()
        };
      } catch(ex){
        self.settings = {
          ent_id:  null,
          loc_id:  null,
          mac_id: null
        };
        console.log(ex);
      }
    }
    refresh();

    self.save = function () {
      SettingsService.setEntityId(self.settings.ent_id);
      SettingsService.setLocationId(self.settings.loc_id);
      SettingsService.setMachineId(self.settings.mac_id);
      SettingsService.setCashId(self.settings.cash_id);
      Restangular.setBaseUrl(self.settings.url);
      AppConfig.setBaseUrl(self.settings.url);
      SettingsService.save();

      SyncService.do().then(function () {
        SettingsService.setEntityId(self.settings.ent_id);
        SettingsService.setLocationId(self.settings.loc_id);
        SettingsService.setMachineId(self.settings.mac_id);
        SettingsService.save();
      });


    }

  }]);
