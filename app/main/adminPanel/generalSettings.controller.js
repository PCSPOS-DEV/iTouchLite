/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('GeneralSettingsCtrl', ['$scope', 'SettingsService', '$state', 'SyncService', 'AppConfig', 'Restangular', '$q', 'Alert', 'ionicDatePicker', 'ControlService', 'LogService',
    function ($scope, SettingsService, $state, SyncService, AppConfig, Restangular, $q, Alert, ionicDatePicker, ControlService, LogService) {
      var self = this;
      var ask = 0;
      self.settings = {};
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();
      // var Bdate;
      // if (ControlService.getBusinessDate() == undefined) {
      //   Bdate = '';
      // } else {
      //   Bdate = ControlService.getBusinessDate().format('YYYY-MM-DD');
      // }

      $scope.$on('viewOpen', function (event, data) {
        if (data == 'general') {
          $scope.loadingHide();
          refresh();
        }
      });

      var datePickerOptions = {
        callback: function (val) {
          SettingsService.setBusinessDate(val);
          refresh();
        },
        setLabel: 'Set',
        showTodayButton: true,
      };


      $scope.setBDate = function () {
        // console.log('GGWP');
        ionicDatePicker.openDatePicker(datePickerOptions);

      };

      var refresh = function () {
        console.log(AppConfig.getDisplayUrl());
        try {
          console.log(SettingsService.getBusinessDate());
          self.settings = {
            ent_id: SettingsService.getEntityId(),
            loc_id: SettingsService.getLocationId(),
            mac_id: SettingsService.getMachineId(),
            cash_id: SettingsService.getCashId(),
            business_date: SettingsService.getBusinessDate(),
            doc_id: ControlService.getDocId(),
            displayurl: AppConfig.getDisplayUrl(),
            url: AppConfig.getBaseUrl(),
            outletServerUrl: AppConfig.getOutletServerUrl(),
          };
        } catch (ex) {
          self.settings.ent_id = null;
          self.settings.loc_id = null;
          self.settings.mac_id = null;

          console.log(ex);
          errorLog.log('GeneralSettingsCtrl Refresh Exception : ' + ex);
        }
      };
      refresh();

      self.saveSetting = function () {
        Alert.showLoading();
        if (!_.isUndefined(self.settings.url) && !_.isNull(self.settings.url) && !_.isEmpty(self.settings.url)) {
          checkStatus(self.settings.url).then(function () {
            Restangular.setBaseUrl(self.settings.url);
            AppConfig.setBaseUrl(self.settings.url);
            if (_.isUndefined(self.settings.ent_id) || _.isNull(self.settings.ent_id)) {
              return false;
            }
            if (_.isUndefined(self.settings.loc_id) || _.isNull(self.settings.loc_id)) {
              return false;
            }
            if (_.isUndefined(self.settings.mac_id) || _.isNull(self.settings.mac_id)) {
              return false;
            }
            if (_.isUndefined(self.settings.doc_id) || _.isNull(self.settings.doc_id)) {
              return false;
            }
            if (self.settings.displayurl == '') {
              self.settings.displayurl = 'display url';
            }
            ControlService.saveDocId(self.settings.doc_id);
            AppConfig.setDisplayUrl(self.settings.displayurl);
            SettingsService.setEntityId(self.settings.ent_id);
            SettingsService.setLocationId(self.settings.loc_id);
            SettingsService.setMachineId(self.settings.mac_id);
            SettingsService.setCashId(self.settings.cash_id);
        // SettingsService.setBusinessDate(self.settings.business_date);
            SettingsService.save();

            SyncService.do().then(function () {
              SettingsService.setEntityId(self.settings.ent_id);
              SettingsService.setLocationId(self.settings.loc_id);
              SettingsService.setMachineId(self.settings.mac_id);
              SettingsService.save();
            });
            return true;
          }, function () {
            errorLog.log('GeneralSettingsCtrl Invalid base url entered');
            Alert.warning('Invalid base url entered');
          });
        }

        if (!_.isUndefined(self.settings.outletServerUrl) && !_.isNull(self.settings.outletServerUrl) && !_.isEmpty(self.settings.outletServerUrl)) {
          checkStatus(self.settings.outletServerUrl).then(function () {
            AppConfig.setOutletServerUrl(self.settings.outletServerUrl);
            return true;
          }, function () {
            errorLog.log('GeneralSettingsCtrl Invalid outlet server url entered');
            Alert.warning('Invalid outlet server url entered');
          });
        }

        else {
          errorLog.log('GeneralSettingsCtrl Please insert data');
          Alert.warning('Please insert data');
        }
        Alert.hideLoading();
        LogService.SaveLog();
      };

      self.save = function (check) {
        if (ask == 0) {
          Alert.showConfirm('Are you sure you want to save setting?', 'Save Setting', function (res) { //
            if (res == 1) { //
              self.saveSetting();
            } //
          });
        } else {
          self.saveSetting();
          ask = 0;
        }

      };

      self.reset = function () {
        ask = 1;
        Alert.showConfirm('Are you sure you want to reset setting? Recommendation: Reset only after upload data & day end. ', 'Reset Setting', function (res) { //
          if (res == 1) { //
            self.clear();
            Restangular.setBaseUrl('http://172.16.110.114:89/iTouchLiteSyncServices/iTouchLiteSyncService.svc/');
            AppConfig.setBaseUrl('http://172.16.110.114:89/iTouchLiteSyncServices/iTouchLiteSyncService.svc/');
            AppConfig.setOutletServerUrl('http://172.16.110.114:89/iTouchLiteSyncServices/iTouchLiteSyncService.svc/');
            AppConfig.setDisplayUrl('http://172.16.110.99:999/api');
            ControlService.saveDocId('R00001');
            SettingsService.getBusinessDate(null);
            SettingsService.setEntityId('');
            SettingsService.setLocationId('');
            SettingsService.setMachineId('');
            SettingsService.setCashId('');
          } //
        }); //
      };

      self.clear = function () {
        try {
          self.settings = {
            ent_id: '',
            loc_id: '',
            mac_id: '',
            cash_id: '',
            // business_date: '',
            displayurl: AppConfig.getDisplayUrl(),
            url: AppConfig.getBaseUrl(),
            outletServerUrl: AppConfig.getOutletServerUrl(),
            business_date: null
          };
        } catch (ex) {
          errorLog.log('GeneralSettingsCtrl ex' + ex);
          self.settings.ent_id = null;
          self.settings.loc_id = null;
          self.settings.mac_id = null;

          console.log(ex);
        }
      };

      var checkStatus = function (url) {
        return Restangular.oneUrl('checkStatus', url + 'test').withHttpConfig({timeout: 3000}).get().then(function (res) {
          if (res == 'true' || res == true) {
            return true;
          } else {
            errorLog.log('GeneralSettingsCtrl Invalid Service');
            return $q.reject('Invalid service');
          }
        }, function (err) {
          console.log(err);
          errorLog.log('GeneralSettingsCtrl' + err.statusText);
          return $q.reject(err.statusText);
        });
      };

    }]);
