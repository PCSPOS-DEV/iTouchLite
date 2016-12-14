/**
 * Created by shalitha on 23/5/16.
 */
angular.module('itouch.services')
.service('Alert', ['$ionicLoading', '$ionicPopup', function ($ionicLoading, $ionicPopup) {
  this.showLoading = function () {
    $ionicLoading.show({
      template: '<ion-spinner icon="lines"></ion-spinner>',
      noBackdrop: false
    });
  };

  this.hideLoading = function () {
    $ionicLoading.hide();
  };

  this.CLASS_WARNING = 'energized';
  this.CLASS_ERROR = 'assertive';
  this.CLASS_INFO = 'calm';

  this.showAlert = function (title, message, cssClass) {
    return $ionicPopup.alert({
      cssClass: cssClass || null,
      title: title,
      template: message
    });
  }

  this.success = function (message, title) {
    return $ionicPopup.alert({
      // cssClass: cssClass || null,
      title: title,
      template: message
    });
  }

  this.showConfirm = function(message, title){
    return $ionicPopup.confirm({
      title: title,
      template: message
    });
  }
}]);
