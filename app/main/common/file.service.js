/**
 * Created by shalitha on 1/6/16.
 */
angular.module('itouch.services')
.factory('FileService', ['$q', '$http', function ($q, $http) {
  var self = this;

  var authHeaderValue = function (username, password) {
    var tok = username + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
  };
  var options = {
    headers: authHeaderValue('ftpuser', 'PCSpos2012')
  };

  self.fetch = function () {

  };

  return self;
}]);
