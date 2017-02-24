/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ModifierCtrl', ['$scope', 'ModifierService', 'BillService', 'ItemService', 'CartItemService', '$q',
    function ($scope, ModifierService, BillService, ItemService, CartItemService, $q) {
      var self = this;
      self.pages = {};
      self.selectedPage = null;
      self.view = 1;
      self.subPlus = [];
      self.cart = [];
      self.selectedCart = [];

      $scope.$on('modal.shown', function(event, data){
        if($scope.shownModal = 'mod'){
          // handle event
          self.view = 1;
          self.cart = [];
          refresh();
          var item = $scope.cart.selectedItem;
          if(item){
            ModifierService.getItemModifiers(item.LineNumber).then(function(data){
              self.selectedCart = data;
            });
          }
        }
      });

      var refresh = function () {
        if($scope.type){
          self.title = $scope.type == 'F' ? 'Food Modifiers' : 'Drink Modifiers';
          ModifierService.get($scope.type == 'F' ? 'F' : 'B').then(function(modifiers) {
            angular.forEach(modifiers, function(row){
              if(!self.pages[row.PageNo]){
                self.pages[row.PageNo] = {};
              }
              for(var i = 1; i <= 32; i++){
                var key = _.findWhere(modifiers, { PageNo: row.PageNo, KeyNo: i });
                // console.log(key, i);
                // if(key){
                self.pages[row.PageNo][i] = key ? key : {};
                // }
              }
            });
            self.selectPage(self.pages[_.first(_.keys(self.pages))]);
          }, function(err){
            console.log(err);
          });
        }
      }

      var fetchExistingModifiers = function(){

      }

      self.close = function () {
        $scope.$emit('modifier.modal.close');
      }

      self.selectPage = function(page){
        _.map(self.pages, function(p){
          p.selected = false;
          return p;
        });
        page.selected = true;
        self.selectedPage = page;
      }

      self.selectItem = function(item){
        if(item){
          ModifierService.getSubPlu(item.Plu, item.PageNo, item.KeyNo).then(function(modifiers) {
            if(_.isArray(modifiers)){
              if(modifiers.length > 1){
                self.subPlus = modifiers;
                self.view = 2;
              } else {
                self.selectSubPlu(_.first(modifiers));
              }
            }
          }, function (err) {
            console.log(err);
          });
        }
      }

      self.selectSubPlu = function(spItem){
        if(spItem){
          ItemService.getById(spItem.ItemId).then(function(item) {
            if(item && !_.find(self.selectedCart, { ItemId: item.Id })){
              item.SubPluDesc1 = spItem.Description1;
              item.SubPluDesc2 = spItem.Description2;
              renameProperty(item, 'Id', "ItemId");
              item.ItemType = 'MOD';
              item.ParentItemLineNumber = $scope.cart.selectedItem.LineNumber;
              item.Qty = $scope.cart.selectedItem.Qty;
              BillService.loadLineNewNumber($scope.cart.selectedItem.LineNumber).then(function(ln){
                item.LineNumber = ln + 1;
                self.cart.push(item);
                self.view = 1;
              });

            }
          }, function (err) {
            console.log(err);
          });
        }
      }


      self.save = function () {
        if(self.cart.length > 0){
          var promises = [];
          angular.forEach(self.cart, function(item){
            item.Description1 = item.SubPluDesc1 + " " + item.Description1;
            item.Description2 = item.SubPluDesc1 + " " + item.Description2;
            promises.push(CartItemService.addItemToCart(item));
          });
          $q.all(promises).then(function(res){
            $scope.$emit('refresh-cart');
            $scope.$emit('modifier.modal.close');
          }, function (err) {
            console.log(err);
          });
        }
      }

      self.goBack = function(){
        self.view = 1;
      }

    }]);
