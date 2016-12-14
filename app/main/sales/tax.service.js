/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
.factory("TaxService", ['LocationService', function (LocationService) {
  var location = LocationService.currentLocation;
  if(!location){
    LocationService.get().then(function (loc) {
      location = loc;
    });
  }

  return {
    getForItem: function (item) {
      return 0;
    },
    getForTender: function (tender) {
      return 0;
    }
  }
}]);
