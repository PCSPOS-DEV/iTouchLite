/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory('SettingsService', ['$localStorage', '$q', 'Restangular', 'DB', 'DB_CONFIG', function ($localStorage, $q, Restangular, DB, DB_CONFIG) {
    var self = this;
    var settings = $localStorage.settings || {};
    var syncLog = new debugout();

    self.StartSyncLog = function() {
      return syncLog;
    }
    //TODO: remove this once settings page done
    if (!settings.roundFor) {
      settings.roundFor = 'M';
    }

    //TODO: remove this once settings page done
    if (!settings.roundDelta) {
      settings.roundDelta = 0.05;
    }

    self.setEntityId = function (ent_id) {
      settings.ent_id = ent_id;
    };

    self.getEntityId = function () {
      if (settings.ent_id) {
        return settings.ent_id;
      } else {
        return null;
      }
    };

    self.setLocationId = function (loc_id) {
      settings.loc_id = loc_id;
      if (loc_id) {
        self.getLocation(loc_id).then(function (location) {
          if (location) {
            console.log(location);
            settings.location = location;
            self.save();
          }
        }, function (err) {
          console.log(err);
        });
      }
    };

    self.getLocationId = function () {
      if (settings.loc_id) {
        return settings.loc_id;
      } else {
        return null;
      }
    };

    self.setMachineId = function (mac_id) {
      settings.mac_id = mac_id;
      if (mac_id) {
        self.getMachine(mac_id).then(function (machine) {
          if (machine) {
            console.log(machine);
            settings.machine = machine;
            self.save();
          }
        }, function (err) {
          console.log(err);
        });
      }
    };

    self.getMachineId = function () {
      if (settings.mac_id) {
        return parseInt(settings.mac_id);
      } else {
        return null;
      }

    };

    self.setRoundFor = function (roundFor) {
      settings.roundFor = roundFor;
    };

    self.getRoundFor = function () {
      if (settings.roundFor) {
        return settings.roundFor;
      } else {
        return null;
      }

    };

    self.setRoundDelta = function (roundDelta) {
      settings.roundDelta = roundDelta;
    };

    self.getRoundDelta = function () {
      if (settings.roundDelta) {
        return parseFloat(settings.roundDelta);
      } else {
        return null;
      }

    };

    self.save = function () {
      $localStorage.settings = settings;
    };


    self.fetchMachines = function () {
      var deferred = $q.defer();
      var entityId = self.getEntityId();
      if (entityId) {
        Restangular.one('GetMachineDetails').get({EntityId: entityId}).then(function (res) {
          console.log('machines fetch done');
          machines = JSON.parse(res);
          DB.addInsertToQueue(DB_CONFIG.tableNames.config.machines, machines);
          syncLog.log('  Machines Sync Complete', 1);
          deferred.resolve();
        }, function (err) {
          syncLog.log('  Machines Sync Error : Unable to fetch data from the server', 1);
          deferred.reject('Unable to fetch data from the server');
          console.error(err);
        });
      } else {
        syncLog.log('  Machines Sync Error : Entity ID is not available', 1);
        deferred.reject('Entity ID is not available');
      }
      return deferred.promise;
    };

    self.getMachine = function (id) {
      return DB.select(DB_CONFIG.tableNames.config.machines, '*', { columns: 'Id=?', data: [id] }).then(function (res) {
        return DB.fetch(res);
      });
    };

    self.getLocation = function (id) {
      return DB.select(DB_CONFIG.tableNames.locations.locations, '*', { columns: 'Id=?', data: [id] }).then(function (res) {
        return DB.fetch(res);
      });
    };

    self.getCurrentMachine = function () {
      if (settings.machine) {
        return settings.machine;
      } else {
        return null;
      }
    };

    self.setCashId = function (cash_id) {
      settings.cash_id = cash_id;
    };

    self.getCashId = function () {
      if (settings.cash_id) {
        return parseInt(settings.cash_id);
      } else {
        return null;
      }

    };

    self.setBusinessDate = function (bussinessdate) {
      settings.business_date = bussinessdate;
      $localStorage.app_config.businessDate = bussinessdate;
      DB.query('DELETE FROM ' + DB_CONFIG.tableNames.bill.tempHeader);
    };

    self.getBusinessDate = function () {
      if (settings.business_date) {
        return (_.isNumber(settings.business_date)) ? moment(settings.business_date).format('DD-MMM-YYYY') : settings.business_date;
        // return settings.business_date;
      }
      else{
        return null;
      }
    }

    return self;
  }]);
