/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("AdminPanelCtrl", ['$log', '$rootScope', '$scope',
    function ($log, $rootScope, $scope) {
      var self = this;

      self.changePage = function(page){
        // $scope.loadingShow();
        $rootScope.$broadcast('viewOpen', page.name);
        self.pages  = _.map(self.pages, function (page) {
          page.active = false;
          return page;
        });
        page.active = true;
        self.page = page;
      }

      self.pages = [
        { name: 'general', text: 'General', template: 'main/adminPanel/general.html' },
        { name: 'functions', text: 'Functions', template: 'main/adminPanel/functions.html' },
        { name: 'printer', text: 'Printer', template: 'main/adminPanel/printerSetup.html' },
      ];

      $scope.$on("$ionicView.afterEnter", function(event, data){
        $scope.loadingHide();
        self.changePage(_.first(self.pages));
      });



      return self;
    }]);