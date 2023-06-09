
angular.module('itouch')

  .directive('loadingPane', [function () {
    return {
      restrict: 'E',
      scope: {
        show: '@'
      },
      template: '<div class="loading-pane" ng-show="show">' +
                      '<ion-spinner class="spinner-energized text-center" icon="lines"></ion-spinner>' +
                    '</div>'
    };
  }]);
