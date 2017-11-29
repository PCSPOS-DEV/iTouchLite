/**
 * Created by shalitha on 17/5/16.
 */
'use strict';
angular.module('itouch.controllers')
  .controller('FunctionsCtrl', ['$log', 'FunctionsService', 'Alert', '$q', 'AuthService', '$scope',
    function ($log, FunctionsService, Alert, $q, AuthService, $scope) {
      var self = this;
      self.data = {
        functions: []
      };
      self.selectedFunction = null;
      self.accessLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      self.types = [
        { id: 'V' },
        { id: 'F' },
        { id: 'T' }
      ];
      self.selectedFunction = null;
      self.insert = false;

      $scope.$on('viewOpen', function (event, data) {
        if (data == 'functions') {
          self.refresh();
        }
      });

      self.refresh = function () {
        self.selectedFunction = null;
        self.insert = false;
        var currentUser = AuthService.currentUser();

        FunctionsService.get().then(function (fns) {
          fns = _.map(fns, function (fn) {
            if (fn) {
              fn.Inactive = fn.Inactive == 'true';
              fn.Transact = fn.Transact == 'true';

              if (currentUser) {
                if (_.isUndefined(fn['Description' + currentUser.DescriptionLevel])) {
                  fn.undefined = false;
                } else if ((fn['Description' + currentUser.DescriptionLevel] == null || fn['Description' + currentUser.DescriptionLevel] == '')) {
                  fn.undefined = true;
                }
              }

            }
            return fn;
          });
          if (_.isArray(fns)) {
            self.data.functions = fns;
          } else {
            self.data.functions = [];
          }
        });
      };

      self.refresh();

      self.selectFunction = function (fn) {
        if (fn) {
          self.data.functions = _.map(self.data.functions, function (fn) {
            fn.active = false;
            return fn;
          });
          // console.log(fn.Transact);
          fn.active = true;

        }
        self.selectedFunction = fn;

      };

      self.createNewButtonClick = function () {
        self.insert = true;
        self.selectFunction({});
      };

      self.saveFunction = function () {
        var code;
        if (self.insert) {
          code = FunctionsService.getNextCode();
        } else {
          code = $q.when(self.selectedFunction.Code);
        }
        code.then(function (code) {
          self.selectedFunction.Code = code;

          if (self.validate(self.selectedFunction, ['Code', 'Name'])) {
            var promise;
            var item = _.pick(self.selectedFunction, ['Code', 'Description1', 'Description2', 'Name', 'Inactive', 'Transact', 'Type', 'AccessLevel', 'DisplayOnTop']);
            if (self.insert) {
              promise = FunctionsService.insert(item);
            } else {
              promise = FunctionsService.update(item, { columns: 'Code = ?', data: [code] });
            }
            promise.then(function () {
              self.refresh();
              Alert.success('Data Saved');
            }, function (ex) {
              console.log(ex);
              Alert.error(ex);
            });
          }
        });

      };

      self.validate = function (obj, reqCols) {
        if (obj && reqCols && _.size(obj) > 0 && reqCols.length > 0) {
          var valid = true;
          var errors = [];
          angular.forEach(reqCols, function (col) {
            if (!obj[col]) {
              valid = false;
              errors.push('Column ' + col + ' cannot empty');
            }
          });
          if (!valid) {
            Alert.error('Function is not valid: ' + errors.join(', '));
          }
          return valid;
        } else {
          Alert.error('Function is not valid');
          return true;
        }
      };

      self.cancelFunction = function () {
        self.refresh();
      };


      return self;
    }]);
