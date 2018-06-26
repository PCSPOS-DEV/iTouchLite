/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.services')
  .factory('AuthService', ['Restangular', 'DB', '$q', '$ionicPlatform', 'SettingsService', '$localStorage', '$state', 'DB_CONFIG',
    function (Restangular, DB, $q, $ionicPlatform, SettingsService, $localStorage, $state, DB_CONFIG) {
      var self = this;
      var users = [];
      var tempUser = null;
      syncLog = SettingsService.StartSyncLog();

      self.fetchUsers = function () {
        var deferred = $q.defer();
        var locationId = SettingsService.getLocationId();
        if (locationId) {
          Restangular.one('GetStaffByLocations').get({LocationId: locationId}).then(function (res) {
            console.log('users fetch done');
            users = JSON.parse(res);
            users = _.map(users, function (user, key) {
              user.Password = user.EncPass;
              return _.omit(user, 'EncPass');
            });
            DB.addInsertToQueue(DB_CONFIG.tableNames.auth.staff, users);
            syncLog.log('  User Sync Complete', 1);
            deferred.resolve();
          }, function (err) {
            syncLog.log('  User Sync Error : Could fetch data from the server', 1);
            deferred.reject('Could fetch data from the server');
            console.error(err);
          });
        } else {
          syncLog.log('  User Sync Fail : Location ID is not available', 1);
          deferred.reject('Location ID is not available');
        }
        return deferred.promise;
      };

      self.attempt = function (username, password, temp) {
        var deferred = $q.defer();
        DB.query('SELECT * FROM ' + DB_CONFIG.tableNames.auth.staff + ' WHERE Code = ? LIMIT 1', [username]).then(function (rs) {
          var user = DB.fetch(rs);
          if (user) {
            if (user.Password === CryptoJS.SHA1(password).toString(CryptoJS.enc.Base64)) {
              if (!temp) {
                $localStorage.user = user;
              }
              deferred.resolve(user);
            } else {
              deferred.reject('Wrong password');
            }
          } else {
            deferred.reject('User not found');
          }
        }, function (err) {
          console.log('Error ', err);
          deferred.reject('Unable to get data');
        });

        return deferred.promise;
      };

      self.logout = function () {
        delete $localStorage.user;
        $state.go('login');
      };

      self.currentUser = function () {
        return $localStorage.user;
      };

      self.isLoggedIn = function () {
        return $localStorage.user != null;
      };

    // TODO: implement shift management
      self.getShift = function () {
        return { Id: 0 };
      };

      self.isAuthorized = function (functionAccessLevel, user) {
      // if(!user){
      //   // if($localStorage.user){
      //   //   user = $localStorage.user;
      //   // } else {
      //   //   return false;
      //   // }
      // }
        try {
          return parseInt(user.SecurityLevel) >= parseInt(functionAccessLevel);
        } catch (ex) {
          return false;
        }
      };

      self.getTempUser = function () {
        return tempUser;
      };

      self.setTempUser = function (user) {
        tempUser = user;
      };

      self.getUserById = function (id) {
        return DB.select(DB_CONFIG.tableNames.auth.staff, '*', { columns: 'Id=?', data: [id] }).then(function (res) {
          return DB.fetch(res);
        });
      };

      return self;
    }]);
