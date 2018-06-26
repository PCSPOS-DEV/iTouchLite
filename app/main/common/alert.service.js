/**
 * Created by shalitha on 23/5/16.
 */
angular.module('itouch.services')
  .service('Alert', ['$ionicLoading', '$ionicPopup', '$cordovaDialogs', function ($ionicLoading, $ionicPopup, $cordovaDialogs) {
    this.showLoading = function (BD) {
      if (BD == "" || null || undefined) {
        BD = false;
      }
      $ionicLoading.show({
        template: '<ion-spinner icon="lines"></ion-spinner>',
        noBackdrop: BD
      });
    };

    this.hideLoading = function () {
      $ionicLoading.hide();
    };

    this.CLASS_WARNING = 'energized';
    this.CLASS_ERROR = 'assertive';
    this.CLASS_INFO = 'calm';

    this.showAlert = function (title, message, cssClass) {
      $cordovaDialogs.alert(message, title || 'Alert');
    };

    this.success = function (message, title) {
      return $ionicPopup.alert({
        // cssClass: cssClass || null,
        title: title,
        template: message
      });
    };

    this.error = function (message, title) {
      $cordovaDialogs.alert(message, title || 'Error');
    };

    this.warning = function (message, title) {
      $cordovaDialogs.alert(message, title || 'Warning');
    };

    this.success = function (message, title) {
      $cordovaDialogs.alert(message, title || 'Success');
    };


    this.showConfirm = function (message, title, func, buttons) {
      // return $ionicPopup.confirm({
      //   title: title,
      //   template: message
      // });
      if (!buttons) {
        buttons = ['Yes', 'No'];
      }
      navigator.notification.confirm(message, func, title, buttons);

    };
  }]);
