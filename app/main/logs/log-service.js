/**
 * Created by Lynn on 5th June 2018.
 */
angular.module('itouch.services')
  .service('LogService', ['SettingsService', 'AppConfig', 'ControlService',
    function (SettingsService, AppConfig, ControlService) {
      var self = this;

      var errorLog = new debugout();
      var eventLog = new debugout();

      var EntityId = SettingsService.getEntityId();
      var MachineId = SettingsService.getMachineId();
      var LocationId = SettingsService.getLocationId();
      var FilName = moment(angular.copy(ControlService.getDayEndDate())).format('YYYYMMMDD') + '-' + EntityId + '-' + MachineId + '-' + LocationId;
      var requestUrl = AppConfig.getDisplayUrl() + '/Log/Write';
      console.log(requestUrl);


      var eventlog;
      var errorlog;

      var synclog = localStorage.getItem('SyncLogs');
      if (synclog == null) { synclog = 'no Data'; }
      var syncdata = synclog.split('\n');
      var PSyncLog = syncdata.join('|');

      var uploadlog = localStorage.getItem('UploadLogs');
      if (uploadlog == null) { uploadlog = 'no Data'; }
      var uploaddata = uploadlog.split('\n');
      var PUploadLog = uploaddata.join('|');

      self.PostLogData = function () {
        self.PostFunction();
        self.PostFunction();
        self.PostFunction(PSyncLog, 3);
        self.PostFunction(PUploadLog, 4);
      };

      self.PostFunction = function (LogsData, LogType) {
        $http({
          method: 'POST',
          url: requestUrl,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            'message': LogsData,
            'entityId': EntityId,
            'locationId': LocationId,
            'machineId': MachineId,
            'logType': LogType
          }
        }).then(function successCallback (response) {
          console.log(response);
          console.log('Post');
        }, function errorCallback (response) {
          console.log(response);
        });
      };

      self.GetFileName = function () {
        return FilName;
      };

      self.GeterrorLog = function () {
        return errorLog;
      };

      self.GeteventLog = function () {
        return eventLog;
      };

      self.sendSyncLog = function () {
        self.PostFunction(PSyncLog, 3);
      };

      self.sendUploadLog = function () {
        self.PostFunction(PUploadLog, 4);
      };


    }]);
