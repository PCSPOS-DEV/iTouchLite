/**
 * Created by Lynn on 5th June 2018.
 */
angular.module('itouch.services')
  .service('LogService', ['SettingsService', 'AppConfig', 'ControlService', '$http', 'UploadService',
    function (SettingsService, AppConfig, ControlService, $http, UploadService) {
      var self = this;

      syncLog = SettingsService.StartSyncLog();
      uploadLog = UploadService.StartuploadLog();
      var errorLog = new debugout();
      var eventLog = new debugout();
      var debugLog = new debugout();

      var EntityId = SettingsService.getEntityId();
      var MachineId = SettingsService.getMachineId();
      var LocationId = SettingsService.getLocationId();
      var FilName = moment(angular.copy(ControlService.getDayEndDate())).format('YYYYMMMDD') + '-' + EntityId + '-' + MachineId + '-' + LocationId;
      var requestUrl = AppConfig.getDisplayUrl() + '/Log/Write';
      console.log(requestUrl);

      self.checkstorage = function () {
        var storageSize = Math.round(JSON.stringify(localStorage).length / 1024);
        if (storageSize >= 1800) {
          PostLogData();
        }
        return storageSize;
      };

      var errorlog = localStorage.getItem('ErrorLogs');
      if (errorlog == null) { errorlog = 'no Data'; }
      var errordata = errorlog.split('\n');
      var PErrorLog = errordata.join('|');

      var eventlog = localStorage.getItem('EventLogs');
      if (eventlog == null) { eventlog = 'no Data'; }
      var eventdata = eventlog.split('\n');
      var PEventLog = eventdata.join('|');

      var synclog = localStorage.getItem('SyncLogs');
      if (synclog == null) { synclog = 'no Data'; }
      var syncdata = synclog.split('\n');
      var PSyncLog = syncdata.join('|');

      var uploadlog = localStorage.getItem('UploadLogs');
      if (uploadlog == null) { uploadlog = 'no Data'; }
      var uploaddata = uploadlog.split('\n');
      var PUploadLog = uploaddata.join('|');

      var debugLogs = localStorage.getItem('DebugLogs');
      if (debugLogs == null) { debugLogs = 'no Data'; }
      var debugdata = debugLogs.split('\n');
      var PDebugLog = debugdata.join('|');

      self.PostLogData = function () {
        self.PostFunction(PErrorLog, 0);
        self.PostFunction(PEventLog, 1);
        self.PostFunction(PSyncLog, 2);
        self.PostFunction(PUploadLog, 3);
        // self.PostFunction(PUploadLog, 3);
      };

      self.PostFunction = function (LogsData, LogType) {
        // console.log(LogsData);console.log(LogType);
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
          if (LogType == 0) {
            localStorage.removeItem('ErrorLogs');
            errorLog.clear();
          } else if (LogType == 1) {
            localStorage.removeItem('EventLogs');
            eventLog.clear();
          } else if (LogType == 2) {
            localStorage.removeItem('SyncLogs');
            syncLog.clear();
          } else if (LogType == 3) {
            localStorage.removeItem('UploadLogs');
            uploadLog.clear();
          }
          localStorage.removeItem('DebugLogs');
          console.log(response);
          console.log('Post');
        }, function errorCallback (response) {
          console.log(response);
        });
      };

      self.GetFileName = function () {
        return FilName;
      };

      self.StartErrorLog = function () {
        return errorLog;
      };

      self.StartEventLog = function () {
        return eventLog;
      };

      self.StartDebugLog = function () {
        return debugLog;
      };

      self.sendErrorLog = function () {
        self.PostFunction(PErrorLog, 0);
      };

      self.sendEventLog = function () {
        self.PostFunction(PEventLog, 1);
      };

      self.sendSyncLog = function () {
        self.PostFunction(PSyncLog, 2);
      };

      self.sendUploadLog = function () {
        self.PostFunction(PUploadLog, 3);
      };

      self.SaveLog = function () {
        self.SaveEventLog();
        self.SaveErrorLog();
        self.SaveDebugLog();
      };

      self.SaveEventLog = function () {
        var Eventlog = localStorage.getItem('EventLogs');
        // console.log('Eventlog: O');console.log(Eventlog);
        localStorage.removeItem('EventLogs');
        var logs = eventLog.getLog();
        eventLog.clear();
        // console.log('Eventlog: N');console.log(logs);
        if (Eventlog == null) {Eventlog = '';}
        try {
          localStorage.setItem('EventLogs', Eventlog + logs);
        } catch (ex1) {
          if ( ex1.name === 'QuotaExceededError' || ex1.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            Eventlog.log('Eventlog : QuotaExceededError');
            LogService.sendEventLog();
          } else {
            Eventlog.log('Important Error : ' + ex1);
          }
        }
        // Eventlog = localStorage.getItem('EventLogs');
        // console.log('Eventlog: M');console.log(Eventlog);
      };

      self.SaveErrorLog = function () {
        var Errorlog = localStorage.getItem('ErrorLogs');
        // console.log('Errorlog: O');console.log(Errorlog);
        localStorage.removeItem('ErrorLogs');
        var logs = errorLog.getLog();
        errorLog.clear();
        // console.log('Errorlog: N');console.log(logs);
        if (Errorlog == null) {Errorlog = '';}
        try {
          localStorage.setItem('ErrorLogs', Errorlog + logs);
        } catch (ex1) {
          if ( ex1.name === 'QuotaExceededError' || ex1.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            Errorlog.log('Errorlog : QuotaExceededError');
            LogService.sendErrorlog();
          } else {
            Errorlog.log('Important Error : ' + ex1);
          }
        }
        // Errorlog = localStorage.getItem('ErrorLogs');
        // console.log('Errorlog: M');console.log(Errorlog);
      };

      self.SaveDebugLog = function () {
        var debugLogs = localStorage.getItem('DebugLogs');
        localStorage.removeItem('DebugLogs');
        var logs = debugLog.getLog();
        debugLog.clear();
        if (debugLogs == null) {debugLogs = '';}
        try {
          localStorage.setItem('DebugLogs', debugLogs + logs);
        } catch (ex1) {
          if ( ex1.name === 'QuotaExceededError' || ex1.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            debugLog.log('Errorlog : QuotaExceededError');
            localStorage.removeItem('DebugLogs');
          } else {
            debugLog.log('Important Error : ' + ex1);
          }
        }

      };


    }]);
