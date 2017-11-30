/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ItemSearchCtrl', ['$scope','Alert', 'ItemService', '$ionicScrollDelegate',
    function ($scope, Alert, ItemService, $ionicScrollDelegate) {
      var self = this;
      self.data = {
        searchText: '',
        items: [],
        selectedItem: null
      };
      var scroll = $ionicScrollDelegate.$getByHandle('itemSearch');

      $scope.$on('modal.shown', function(event, data){
        if($scope.shownModal == 'itemSearch'){
          self.data = {
            searchText: '',
            items: [],
            selectedItem: null
          };
        }
      });

      var refresh = function (text) {
        ItemService.getItemsByText(text)
          .then(function (items) {
            // console.log(items);
            self.data.items = items;
            scroll.scrollTop();
          }, function (err) {
            console.log(err);
          })
      }


      self.close = function () {
        $scope.$emit("ItemSearchModal.close");
      }

      self.onSearchSubmit = function(e){
        e.preventDefault();
        if(self.data.searchText){
          refresh(self.data.searchText);
        }
      }

      self.selectItem = function(item){
        self.data.items = _.map(self.data.items, function (item) {
          item.active = false;
          return item;
        });
        item.active = true;
        self.data.selectedItem = item;
      }

      self.save = function(){
        if(self.data.selectedItem){
          $scope.searchedItem = self.data.selectedItem;
          $scope.$emit("ItemSearchModal.close", self.data.selectedItem);
        }
      }

    }]);


