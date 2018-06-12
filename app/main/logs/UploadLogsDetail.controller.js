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
      console.log(uploadlog);
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

      self.sendMail = function(){
        cordova.plugins.email.isAvailable('gmail', function (hasAccount, hasGmail) {});
        
        $cordovaEmailComposer.open({// (I even tried cordova.plugins.email.open)
           to: "pcsposdev@prima.com.sg",
           subject: "Testing Email",
           body: "<h1>Hello</h1>", 
           isHtml: true 
         }).then(function () {
            Alert.success('Email Successfully sent');
           console.log('email sent');
       });
       setTimeout(function () {
         localStorage.removeItem('UploadLogs');
       }, 200)
       
      }
    }]);
