/**
 * Created by shalitha on 22/3/17.
 */
function select () {
  var selectDirective = {
    restrict: 'E',
    link: preLink
  };
  return selectDirective;

  // Functions
  function postLink (scope, element, attrs, ngModel) {
    // / Hide/show accessory bar on ios
    // element.on("touchstart focus", function (e) {
    //   cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    // });
    // element.on("blur", function (e) {
    //   cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    // });

  }
}
