/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('SyncLogsDetailCtrl', ['Alert', '$localStorage', '$scope', '$rootScope', 'SettingsService', '$state', '$cordovaEmailComposer', 'LogService', '$ionicScrollDelegate',
    function (Alert, $localStorage, $scope, $rootScope, SettingsService, $state, $cordovaEmailComposer, LogService, $ionicScrollDelegate) {
      var self = this;
      var synclog = localStorage.getItem('SyncLogs');
      // console.log(synclog);
      var systemDate = new Date();
      var fileName = LogService.GetFileName();
      // console.log(uploadlog);
      if (synclog == null) {
        synclog = 'no Data';
      }
      $scope.newlogs = synclog;
      var lines = synclog.split('\n');
      $scope.totallines = lines.length;
      if ($scope.totallines >= 10000) {
        LogService.sendSyncLog();
        localStorage.removeItem('SyncLogs');
        $scope.newlogs = '';
        $scope.totallines = 0;
      }
      // console.log(lines);
      var startline = 0;
      var lastline = 49;
      var sline = lines.splice(startline, lastline);
      var first = sline.join('\n');

      var pdf = new jsPDF('p', 'pt', 'a4'), source  = 'Text', margin = {top: 30, botton: 40, left: 30, width: 600};
      pdf.setFontSize(12);
      pdf.text('Sync Log', 50, 30);
      pdf.setFontSize(10);
      pdf.text('Location ID = ' + SettingsService.getLocationId() + ', Machine ID = ' + SettingsService.getMachineId(), 50, 45);
      pdf.text('Entity ID = ' + SettingsService.getEntityId() + ', Casher ID = ' + SettingsService.getCashId(), 50, 60);
      pdf.text('Business Date : ' + SettingsService.getBusinessDate(), 50, 75);
      pdf.text('System Date : ' + systemDate, 50, 90);
      pdf.setFontSize(10);
      pdf.text( first, 50, 110 );

      // console.log(lines.length);
      var requirepages = lines.length / 50;
      // console.log('rp : ' + requirepages);

      for (var i = 1; i < requirepages; i++, lastline + 50, startline + 50) {
        // console.log('run? ');
        sline = lines.splice(startline, lastline);
        var newdata = sline.join('\n');
        pdf.addPage();
        pdf.text( newdata, 50, 50 );
      }
      var pdfBase64 = pdf.output('datauristring');
      // console.log(pdfurl);
      // pdf.save('a4.pdf');

      self.deleteManual = function () {
        localStorage.removeItem('SyncLogs');
        $scope.newlogs = '';
        $scope.totallines = 0;
        Alert.success('All Sync Log Delete  Successfully');
      };

      var sent = 0;
      self.sendMail = function () {
        cordova.plugins.email.isAvailable('gmail', function (hasAccount, hasGmail) {});

        $cordovaEmailComposer.open({// (I even tried cordova.plugins.email.open)
          to: 'pcsposdev@prima.com.sg',
          //  cc: , // email addresses for CC field
          //  bcc: , // email addresses for BCC field
          attachments: [SettingsService.generateAttachment(pdfBase64, fileName + '.pdf')],
          subject: 'Sync Log <itouchlite>',
          body: '<h1>Sync Log Attachment</h1>' + '<p>Date : ' + systemDate + '</p>',
          isHtml: true
        }).then(function successCallback () {
          Alert.success('Email Sent Successfully');
          setTimeout(function () {
            localStorage.removeItem('SyncLogs');
            TempLog.clear();
            $scope.totallines = 0;
            $scope.newlogs = '';
          }, 200);
        }, function errorCallback (response) {
          Alert.error(response);
        });

      };

      self.scrollTop = function () {
        $ionicScrollDelegate.scrollTop();
      };

      self.scrollDown = function () {
        $ionicScrollDelegate.scrollBottom();
      };

      self.Back2Logs = function () {
        $state.go('app.admin');
      };


    }]);
