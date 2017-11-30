/**
 * Created by shalitha on 17/5/16.
 */
'use strict';
angular.module('itouch.controllers')
  .controller('AdminPanelCtrl', ['$log', '$rootScope', '$scope', '$ionicHistory', '$ionicNavBarDelegate', '$state',
    function ($log, $rootScope, $scope, $ionicHistory, $ionicNavBarDelegate, $state) {
      var self = this;

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
      ];

      $scope.$on('$ionicView.afterEnter', function (event, data) {
        $scope.loadingHide();
        self.changePage(_.first(self.pages));
        $ionicNavBarDelegate.showBackButton(true);
      });

      self.goBack = function () {
        var back = $ionicHistory.backView();
        if (back) {
          $ionicHistory.goBack();
        } else {
          $state.go('login');
        }

      };


      return self;
    }]);
