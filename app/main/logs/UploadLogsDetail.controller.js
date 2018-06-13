/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('UploadLogsDetailCtrl', ['$log', 'Alert', '$localStorage', '$scope', '$rootScope', 'UploadService', '$state', '$cordovaEmailComposer',
    function ($log, Alert, $localStorage, $scope, $rootScope, UploadService, $state, $cordovaEmailComposer) {
      var self = this;

      // uploadLog = UploadService.StartuploadLog();
      $scope.upinterval = UploadService.getAutoUploadInterval();
      console.log($scope.upinterval);
      var uploadlog = localStorage.getItem('UploadLogs');
      // console.log(uploadlog);
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
      }
      
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
      }

      var lines = uploadlog.split('\n');
      var startline = 0;
      var lastline = 49
      var sline = lines.splice(startline,lastline);
      var first = sline.join('\n');
      var pdf = new jsPDF('p', 'pt', 'a4'), source  = "Text", margin = {top: 30, botton: 40, left: 30, width: 600};
      pdf.setFontSize(10);
      pdf.text( first, 50, 50 );
      var requirepages = lines.length/50;
      for (var i = 1; i < requirepages; i++, lastline+50, startline+50) {
        var sline = lines.splice(startline,lastline);
        var newdata= sline.join('\n');
        pdf.addPage();
        pdf.text( newdata, 50, 50 );
      }
      var pdfurl = pdf.output('dataurl');
      // pdf.save('a4.pdf');

      self.sendMail = function(){
        cordova.plugins.email.isAvailable('gmail', function (hasAccount, hasGmail) {});
        
        $cordovaEmailComposer.open({// (I even tried cordova.plugins.email.open)
           to: "pcsposdev@prima.com.sg",
          //  cc: , // email addresses for CC field
          //  bcc: , // email addresses for BCC field
           attachments: pdfurl,
           subject: "Upload Log <itouchlite>",
           body: "<h1>Upload Log Attachment</h1>", 
           isHtml: true 
         }).then(function () {
           console.log('email sent');
       });
       if (navigator.onLine) {
        Alert.success('Email Sent Successfully');
        } else {
        Alert.warning('No active internet connection: email will automatically sent when online');
        }
       setTimeout(function () {
         localStorage.removeItem('UploadLogs');
       }, 200)
       
      }
    }]);
