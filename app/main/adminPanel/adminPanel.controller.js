/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('AdminPanelCtrl', [ '$rootScope', '$scope', '$ionicHistory', '$ionicNavBarDelegate', '$state', 'AuthService',
    function ($rootScope, $scope, $ionicHistory, $ionicNavBarDelegate, $state, AuthService) {
      var self = this;
      var Pass = true;

      self.changePage = function (page) {
        // $scope.loadingShow();

        self.pages  = _.map(self.pages, function (page) {
          page.active = false;
          return page;
        });
        page.active = true;
        self.page = page;
        $rootScope.$broadcast('viewOpen', page.name);
      };

      self.pages = [
        { name: 'general', text: 'General', template: 'main/adminPanel/general.html' },
        { name: 'functions', text: 'Functions', template: 'main/adminPanel/functions.html' },
        { name: 'printer', text: 'Printer', template: 'main/adminPanel/printerSetup.html' },
        { name: 'images', text: 'Images', template: 'main/adminPanel/imageSetup.html' },
        { name: 'logs', text: 'Logs', template: 'main/adminPanel/logs.html' },
      ];

      $scope.$on('$ionicView.afterEnter', function (event, data) {
        $scope.loadingHide();
        self.changePage(_.last(self.pages));
        // self.changePage(_.first(self.pages));
        $ionicNavBarDelegate.showBackButton(true);
      });

      self.goBack = function () {
        AuthService.checkSetting();
        var back = $ionicHistory.backView();
        // console.log(back);
        if (back && Pass == true) {
          $ionicHistory.goBack();
        } else {
          $state.go('login');
        }

      };


      return self;
    }]);
