
angular.module('itouch')

  .directive('ngEnter', [function () {
    return function (scope, elements, attrs) {
      elements.bind('keydown keypress', function (event) {
        if (13 === event.which) {
          // console.log('enter');
          scope.$apply(function () {
            scope.$eval(attrs.ngEnter);
            event.preventDefault();
          });
        }
      });
    };
  }]);

  // .directive('ngScan', function() {
  //   return function(scope, elements, attrs) {
  //     elements.bind('change', function(event) {
  //       console.log('change');
  //       scope.$apply(function() {
  //         scope.$eval(attrs.ngScan);
  //       });
  //     });
  //   };
  // });
