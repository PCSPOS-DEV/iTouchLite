/**
 * Created by Lynn on 5th June 2018.
 */
angular.module('itouch.controllers')
  .controller('UploadLogsDetailCtrl', ['Alert', '$localStorage', '$scope', '$rootScope', 'UploadService', '$state', '$cordovaEmailComposer', 'SettingsService',
    function (Alert, $localStorage, $scope, $rootScope, UploadService, $state, $cordovaEmailComposer, SettingsService) {
      var self = this;
      var systemDate = new Date();
      TempLog = UploadService.StartuploadLog();
      $scope.upinterval = UploadService.getAutoUploadInterval();
      var uploadlog = localStorage.getItem('UploadLogs');
      if (uploadlog == null) {
        uploadlog = 'no Data';
      }
      $scope.newlogs = uploadlog;
      // $scope.newlogs = uploadLog.getLog();
      // console.log( $scope.newlogs);
      var refresh = function () {
        try {
          self.settings = {
            upinterval: UploadService.getAutoUploadInterval(),
          };
        } catch (ex) {
          self.settings.upinterval = 2;
          console.log(ex);
        }
      };
      refresh();

      self.Back2Logs = function () {
        $state.go('app.admin');
      };

      self.modifyUpload = function () {
        Alert.showLoading();
        if (_.isUndefined(self.settings.upinterval) || _.isNull(self.settings.upinterval) || self.settings.upinterval < 1 || typeof(self.settings.upinterval) != 'number') {
          // return false;
          Alert.error('Invalid setting');
          Alert.hideLoading();
          return false;
        }
        UploadService.setAutoUploadInterval(self.settings.upinterval);
        Alert.success('Updated Auto Upload Interval');
        Alert.hideLoading();
      };

      var lines = uploadlog.split('\n');
      $scope.totallines = lines.length;
      if ($scope.totallines >= 10000) {
        LogService.sendUploadLog();
        localStorage.removeItem('UploadLogs');
        $scope.newlogs = '';
        $scope.totallines = 0;
      }
      // console.log(lines.length);
      var startline = 0;
      var lastline = 49;
      var sline = lines.splice(startline, lastline);
      var first = sline.join('\n');
      var pdf = new jsPDF('p', 'pt', 'a4'), source  = 'Text', margin = {top: 30, botton: 40, left: 30, width: 600};
      pdf.setFontSize(12);
      pdf.text('Upload Log', 50, 30);
      pdf.setFontSize(10);
      pdf.text('Location ID = ' + SettingsService.getLocationId() + ', Machine ID = ' + SettingsService.getMachineId(), 50, 45);
      pdf.text('Entity ID = ' + SettingsService.getEntityId() + ', Casher ID = ' + SettingsService.getCashId(), 50, 60);
      pdf.text('Business Date : ' + SettingsService.getBusinessDate(), 50, 75);
      pdf.text('System Date : ' + systemDate, 50, 90);
      pdf.setFontSize(10);
      pdf.text( first, 50, 110 );
      var requirepages = lines.length / 50;
      for (var i = 1; i < requirepages; i++, lastline + 50, startline + 50) {
        sline = lines.splice(startline, lastline);
        var newdata = sline.join('\n');
        pdf.addPage();
        pdf.text( newdata, 50, 50 );
      }
      var pdfBase64 = pdf.output('datauristring');
      // console.log(pdfurl);
      // pdf.save('a4.pdf');

      self.deleteManual = function () {
        localStorage.removeItem('UploadLogs');
        TempLog.clear();
        $scope.totallines = 0;
        $scope.newlogs = '';
        Alert.success('All Upload Log Delete Successfully');
      };

      self.sendMail = function () {
        cordova.plugins.email.isAvailable('gmail', function (hasAccount, hasGmail) {});

        $cordovaEmailComposer.open({// (I even tried cordova.plugins.email.open)
          to: 'pcsposdev@prima.com.sg',
          //  cc: , // email addresses for CC field
          //  bcc: , // email addresses for BCC field
          subject: 'Upload Log <itouchlite>',
          body: '<h1>Upload Log Attachment</h1>' + '<p>Date : ' + systemDate + '</p>',
          isHtml: true,
          attachments: [SettingsService.generateAttachment(pdfBase64, 'UploadLog.pdf')], //TO DO : Auto attachement
        }).then(function successCallback () {
          Alert.success('Email Sent Successfully');
          setTimeout(function () {
            localStorage.removeItem('UploadLogs');
            TempLog.clear();
            $scope.totallines = 0;
            $scope.newlogs = '';
          }, 200);
        }, function errorCallback (response) {
          Alert.error(response);
        });
      };
    }]);
