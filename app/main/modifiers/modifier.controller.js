/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ModifierCtrl', ['$scope', 'ModifierService', 'BillService', 'ItemService', 'CartItemService', '$q', 'LogService',
    function ($scope, ModifierService, BillService, ItemService, CartItemService, $q, LogService) {
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();
      var self = this;
      self.pages = {};
      self.selectedPage = null;
      self.view = 1;
      self.subPlus = [];
      self.cart = [];
      self.selectedCart = [];
      self.removeList = [];

      $scope.$on('modal.shown', function (event, data) {
        if ($scope.shownModal == 'mod') {
          // handle event
          self.view = 1;
          self.cart = [];
          refresh();
          var item = $scope.cart.selectedItem;
          if (item) {
            ModifierService.getItemModifiers(item.LineNumber).then(function (data) {
              if (data.length > 0) {
                self.cart = _.map(data, function (item) {
                  item.existing = true;
                  return item;
                });
              }
            });
          }
        }
      });

      var refresh = function () {
        if ($scope.type) {
          self.title = $scope.type == 'F' ? 'Food Modifiers' : 'Drink Modifiers';
          ModifierService.get($scope.type == 'F' ? 'F' : 'B').then(function (modifiers) {
            angular.forEach(modifiers, function (row) {
              if (!self.pages[row.PageNo]) {
                self.pages[row.PageNo] = {};
              }
              for (var i = 1; i <= 32; i++) {
                var key = _.findWhere(modifiers, { PageNo: row.PageNo, KeyNo: i });
                // console.log(key, i);
                // if(key){
                self.pages[row.PageNo][i] = key ? key : {};
                // }
              }
            });
            self.selectPage(self.pages[_.first(_.keys(self.pages))]);
          }, function (err) {
            errorLog.log('modifier refresh : ' + err.message);
            console.log(err);
          });
        }
      };

      var fetchExistingModifiers = function () {

      };

      self.close = function () {
        $scope.$emit('modifier.modal.close');
      };

      self.selectPage = function (page) {
        _.map(self.pages, function (p) {
          p.selected = false;
          return p;
        });
        page.selected = true;
        self.selectedPage = page;
      };

      self.selectItem = function (item) {
        if (item) {
          var exItem = _.findWhere(self.cart, { Plu: item.Plu });
          if (!exItem) {
            ModifierService.getSubPlu(item.Plu, item.PageNo, item.KeyNo).then(function (modifiers) {
              if (_.isArray(modifiers)) {
                if (modifiers.length > 1) {
                  self.subPlus = modifiers;
                  self.view = 2;
                } else {
                  self.selectSubPlu(_.first(modifiers));
                }
              }
            }, function (err) {
              errorLog.log('modifier selectItem : ' + err.message);
              console.log(err);
            });
          } else {
            angular.forEach(self.cart, function (it, key) {
              if (item.Plu == it.Plu) {
                self.removeList.push(it);
                self.cart.splice(key, 1);
              }
            });
          }

        }
      };

      self.selectSubPlu = function (spItem) {
        if (spItem) {
          ItemService.getById(spItem.ItemId).then(function (item) {
            if (item && !_.find(self.selectedCart, { ItemId: item.Id })) {
              item.SubPluDesc1 = spItem.Description1;
              item.SubPluDesc2 = spItem.Description2;
              renameProperty(item, 'Id', 'ItemId');
              item.ItemType = 'MOD';
              item.ParentItemLineNumber = $scope.cart.selectedItem.LineNumber;
              item.Qty = $scope.cart.selectedItem.Qty;
              self.cart.push(item);
              self.view = 1;

            }
          }, function (err) {
            errorLog.log('modifier selectSubPlu : ' + err.message);
            console.log(err);
          });
        }
      };


      self.save = function () {
        var parentItem = $scope.cart.selectedItem;
        if (parentItem && self.cart.length > 0) {
          ModifierService.add(parentItem.DocNo, parentItem.LineNumber, angular.copy(self.cart)).then(function (res) {
            angular.forEach(self.removeList, function (removeMod) {
              removeMod.Discount = removeMod.DiscAmount;
              // console.log('gg1');
              setTimeout(function () { $scope.DeleteFunction(removeMod); }, 10);
            } );
            // setTimeout(function () {
            $scope.refreshCart().then(function () {
              $scope.PostApi(res, 5);
            });
            setTimeout(function () {
              $scope.$emit('modifier.modal.close');
            }, 20);
          }, function (err) {
            errorLog.log('modifier save : ' + err.message);
            console.log(err);
          });
        }
      };

      self.goBack = function () {
        self.view = 1;
      };

    }]);
