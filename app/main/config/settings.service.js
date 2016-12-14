/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory("SettingsService", ['$localStorage', function ($localStorage) {
    var self = this;
    var settings = $localStorage.settings || {};

    //TODO: remove this once settings page done
    if(!settings.roundFor){
      settings.roundFor = 'M';
    }

    //TODO: remove this once settings page done
    if(!settings.roundDelta){
      settings.roundDelta = 0.05;
    }

    self.setEntityId = function (ent_id) {
      settings.ent_id = ent_id;
    }

    self.getEntityId = function () {
      if(settings.ent_id){
        return settings.ent_id;
      } else {
        return null;
      }
    }

    self.setLocationId = function (loc_id) {
      settings.loc_id = loc_id;
    }

    self.getLocationId = function () {
      if(settings.loc_id){
        return settings.loc_id;
      } else {
        return null;
      }
    }

    self.setMachineId = function (mac_id) {
      settings.mac_id = mac_id;
    }

    self.getMachineId = function () {
      if(settings.mac_id){
        return parseInt(settings.mac_id);
      } else {
        return null;
      }

    }

    self.setRoundFor = function (roundFor) {
      settings.roundFor = roundFor;
    }

    self.getRoundFor = function () {
      if(settings.roundFor){
        return settings.roundFor;
      } else {
        return null;
      }

    }

    self.setRoundDelta = function (roundDelta) {
      settings.roundDelta = roundDelta;
    }

    self.getRoundDelta = function () {
      if(settings.roundDelta){
        return parseFloat(settings.roundDelta);
      } else {
        return null;
      }

    }

    self.save = function () {
      $localStorage.settings = settings;
    }

    return self;
  }]);
