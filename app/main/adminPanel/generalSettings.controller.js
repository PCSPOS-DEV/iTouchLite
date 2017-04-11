/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("GeneralSettingsCtrl", ['$scope', 'SettingsService', '$state', 'SyncService', 'AppConfig', 'Restangular', '$q', 'Alert',
      function ($scope, SettingsService, $state, SyncService, AppConfig, Restangular, $q, Alert) {
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
          url: AppConfig.getBaseUrl(),
          outletServerUrl: AppConfig.getOutletServerUrl(),
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
      var statusChecks = {};
        if(!_.isUndefined(self.settings.url) && !_.isNull(self.settings.url)){
            statusChecks.baseUrl = checkStatus(self.settings.url).then(function () {
                Restangular.setBaseUrl(self.settings.url);
                AppConfig.setBaseUrl(self.settings.url);
                return true;
            }, function () {
                Alert.warning('Invalid base url entered');
            });
        }

        if(!_.isUndefined(self.settings.outletServerUrl) && !_.isNull(self.settings.outletServerUrl)){
            statusChecks.outletServerUrl = checkStatus(self.settings.outletServerUrl).then(function () {
                AppConfig.setOutletServerUrl(self.settings.outletServerUrl);
                return true;
            }, function () {
                Alert.warning('Invalid outlet server url entered');
            });
        }
      $q.all(statusChecks).finally(function (fin) {

          refresh();
          if(_.isUndefined(self.settings.url) || _.isNull(self.settings.url)){
            return false;
          }
          if(_.isUndefined(self.settings.ent_id) || _.isNull(self.settings.ent_id)){
              return false;
          }
          if(_.isUndefined(self.settings.loc_id) || _.isNull(self.settings.loc_id)){
              return false;
          }
          if(_.isUndefined(self.settings.mac_id) || _.isNull(self.settings.mac_id)){
              return false;
          }

          SettingsService.setEntityId(self.settings.ent_id);
          SettingsService.setLocationId(self.settings.loc_id);
          SettingsService.setMachineId(self.settings.mac_id);
          SettingsService.setCashId(self.settings.cash_id);
          SettingsService.save();

          SyncService.do().then(function () {
              SettingsService.setEntityId(self.settings.ent_id);
              SettingsService.setLocationId(self.settings.loc_id);
              SettingsService.setMachineId(self.settings.mac_id);
              SettingsService.save();
          });
      });


    }

    var checkStatus = function (url) {
        return Restangular.oneUrl("checkStatus", url + "test").withHttpConfig({timeout: 3000}).get().then(function (res) {
            if(res == 'true' || res == true){
                return true;
            } else {
                return $q.reject('Invalid service');
            }
        }, function (err) {
            console.log(err);
            return $q.reject(err.statusText);
        });
    }

  }]);