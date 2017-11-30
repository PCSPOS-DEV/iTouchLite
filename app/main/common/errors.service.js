/**
 * Created by shalitha on 23/5/16.
 */
angular.module('itouch.services')
.service('ErrorService', ['$localStorage', function ($localStorage) {
  var self = this;
  $localStorage.errors = [];

  self.add = function (error) {
    if (_.isArray(error)) {
      $localStorage.errors = error;
    } else {
      $localStorage.errors.push(error);
    }
  };

  self.get = function () {
    return $localStorage.errors;
  };
}]);
