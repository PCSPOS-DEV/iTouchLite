/**
 * Created by Lynn on 5th June 2018.
 */
angular.module('itouch.services')
  .service('LogService', ['SettingsService', 'AppConfig', 'ControlService', '$http', 'UploadService', '$cordovaEmailComposer',
    function (SettingsService, AppConfig, ControlService, $http, UploadService, $cordovaEmailComposer) {
      var self = this;

      syncLog = SettingsService.StartSyncLog();
      uploadLog = UploadService.StartuploadLog();
      var errorLog = new debugout();
      var eventLog = new debugout();
      var debugLog = new debugout();
      var systemDate = new Date();

      var EntityId = SettingsService.getEntityId();
      var MachineId = SettingsService.getMachineId();
      var LocationId = SettingsService.getLocationId();
      var FilName = moment(angular.copy(ControlService.getDayEndDate())).format('YYYYMMMDD') + '-' + EntityId + '-' + MachineId + '-' + LocationId;
      var requestUrl = AppConfig.getDisplayUrl() + '/Log/Write';

      self.checkstorage = function () {
        var storageSize = Math.round(JSON.stringify(localStorage).length / 1024);
        if (storageSize >= 1800) {
          PostLogData();
        }
        return storageSize;
      };

      var debugLogs = localStorage.getItem('DebugLogs');
      if (debugLogs == null) { debugLogs = 'no Data'; }
      var debugdata = debugLogs.split('\n');
      var PDebugLog = debugdata.join('|');

      self.PostLogData = function () {
        self.PostFunction(localStorage.getItem('ErrorLogs'), 0);
        self.PostFunction(localStorage.getItem('EventLogs'), 1);
        self.PostFunction(localStorage.getItem('SyncLogs'), 2);
        self.PostFunction(localStorage.getItem('UploadLogs'), 3);
        // self.PostFunction(PUploadLog, 3);
      };

      self.PostFunction = function (LogsData, LogType) {
        console.log(LogsData);console.log(LogType);
        if (LogsData == null) { LogsData = 'no Data'; }
        var data = LogsData.split('\n');
        var PLog = data.join('|');
        $http({
          method: 'POST',
          url: requestUrl,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            'message': PLog,
            'entityId': EntityId,
            'locationId': LocationId,
            'machineId': MachineId,
            'logType': LogType
          }
        }).then(function successCallback (response) {
          if (LogType == 0) {
            localStorage.removeItem('ErrorLogs');
          } else if (LogType == 1) {
            localStorage.removeItem('EventLogs');
          } else if (LogType == 2) {
            localStorage.removeItem('SyncLogs');
          } else if (LogType == 3) {
            localStorage.removeItem('UploadLogs');
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
        self.PostFunction(localStorage.getItem('ErrorLogs'), 0);
      };

      self.sendEventLog = function () {
        self.PostFunction(localStorage.getItem('EventLogs'), 1);
      };

      self.sendSyncLog = function () {
        self.PostFunction(localStorage.getItem('SyncLogs'), 2);
      };

      self.sendUploadLog = function () {
        self.PostFunction(localStorage.getItem('UploadLogs'), 3);
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
          // if ( ex1.name === 'QuotaExceededError' || ex1.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          eventLog.log('Eventlog : QuotaExceededError');
          LogService.sendEventLog();
          // } else {
          //   eventLog.log('Important Error : ' + ex1);
          // }
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
          // if ( ex1.name === 'QuotaExceededError' || ex1.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          errorLog.log('Errorlog : QuotaExceededError');
          LogService.sendErrorlog();
          // } else {
          //   errorLog.log('Important Error : ' + ex1);
          // }
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
          // if ( ex1.name === 'QuotaExceededError' || ex1.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          debugLog.log('Errorlog : QuotaExceededError');
          localStorage.removeItem('DebugLogs');
          // } else {
          //   debugLog.log('Important Error : ' + ex1);
          // }
        }

      };

      self.EmailLogData = function () {
        var errorlog = localStorage.getItem('ErrorLogs');
        var eventlog = localStorage.getItem('EventLogs');
        var synclog = localStorage.getItem('SyncLogs');
        var uploadlog = localStorage.getItem('UploadLogs');

        var ErrorPdf = self.generatePDF(errorlog);
        var EventPdf = self.generatePDF(eventlog);
        var SyncPdf = self.generatePDF(synclog);
        var UploadPdf = self.generatePDF(uploadlog);

        self.sendMail(ErrorPdf, EventPdf, SyncPdf, UploadPdf);
      };

      self.sendMail = function (ErrorPdf, EventPdf, SyncPdf, UploadPdf) {
        cordova.plugins.email.isAvailable('gmail', function (hasAccount, hasGmail) {});
        $cordovaEmailComposer.open({// (I even tried cordova.plugins.email.open)
          to: 'pcsposdev@prima.com.sg',
            //  cc: , // email addresses for CC field
            //  bcc: , // email addresses for BCC field
          attachments: [SettingsService.generateAttachment(EventPdf, 'EventLog.pdf'), SettingsService.generateAttachment(ErrorPdf, 'ErrorLog.pdf'),
            SettingsService.generateAttachment(SyncPdf, 'SyncLog.pdf'), SettingsService.generateAttachment(UploadPdf, 'UploadLog.pdf')],
          subject: '<itouchlite> Log from Location ID = ' + SettingsService.getLocationId() + ', Machine ID = ' + SettingsService.getMachineId() +
          ', Entity ID = ' + SettingsService.getEntityId() + ', Casher ID = ' + SettingsService.getCashId(),
          body: '<h1>Log Attachment</h1>' + '<p>Date : ' + systemDate + '</p>',
          isHtml: true
        }).then(function successCallback () {
          Alert.success('Email Sent Successfully');
          setTimeout(function () {
            self.PostLogData();
          }, 200);
        }, function errorCallback (response) {
          // Alert.error(response);
        });
      };

      self.generatePDF = function (log) {
        var lines = log.split('\n');
        var startline = 0;
        var lastline = 49;
        var sline = lines.splice(startline, lastline);
        var first = sline.join('\n');
        var pdf = new jsPDF('p', 'pt', 'a4'), source  = 'Text', margin = {top: 30, botton: 40, left: 30, width: 600};
        pdf.setFontSize(10);
        pdf.text('Location ID = ' + SettingsService.getLocationId() + ', Machine ID = ' + SettingsService.getMachineId(), 50, 45);
        pdf.text('Entity ID = ' + SettingsService.getEntityId() + ', Casher ID = ' + SettingsService.getCashId(), 50, 60);
        pdf.text('Business Date : ' + SettingsService.getBusinessDate(), 50, 75);
        pdf.text('System Date : ' + systemDate, 50, 90);
        pdf.setFontSize(10);
        pdf.text( first, 50, 110 );

        var requirepages = lines.length / 50;

        for (var i = 1; i < requirepages; i++, lastline + 50, startline + 50) {
            // console.log('run? ');
          sline = lines.splice(startline, lastline);
          var newdata = sline.join('\n');
          pdf.addPage();
          pdf.text( newdata, 50, 50 );
        }
        var pdfBase64 = pdf.output('datauristring');
        return pdfBase64;
      };
    }]);
