/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('ShiftOptionsCtrl', ['$scope', 'ShiftService', '$ionicModal', '$ionicPopup', '$state', 'Alert', '$q', '$ionicHistory', 'CartItemService', 'Report', 'BillService',
    function ($scope, ShiftService, $ionicModal, $ionicPopup, $state, Alert, $q, $ionicHistory, CartItemService, Report, BillService) {
      var self = this;
      var dayEnd = false;

      $scope.shiftListType = null;

      $scope.$on('modal.shown', function(event, modal) {
        $ionicHistory.nextViewOptions({
          disableAnimate: false,
          disableBack: true
        });

      });


      /**
       * Initiating shift modal dialog
       */
      $ionicModal.fromTemplateUrl('main/shift/selectShift.html', {
        id: 3,
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        self.shiftModal = modal;
      });

      self.openShiftOpenModal = function(){
        $scope.shiftListType = 'open';
        self.shiftModal.show();
      }

      self.openShiftCloseModal = function(){
        $scope.shiftListType = 'close';
        self.shiftModal.show();
      }

      self.openShiftExitModal = function(){
        $scope.shiftListType = 'exit';
        self.shiftModal.show();
      }

      self.openDeclareCash = function(){
        $scope.shiftListType = 'declareCash';
        self.shiftModal.show();
      }

      var openCashPopUp = function(shift, dayEnd){
        $scope.data = {};
        var buttons = [
          {
            text: '<b>Ok</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.cash) {
                //don't allow the user to close unless he enters wifi password
                e.preventDefault();
              } else {
                return $scope.data.cash;
              }
            }
          }
        ];

        if(!dayEnd){
          buttons.push({
            text: 'Later',
            onTap: function(e) {
              // if (!$scope.data.cash) {
              //   //don't allow the user to close unless he enters wifi password
              //   e.preventDefault();
              // } else {
              return 'later';
              // }
            }
          });
        }
        console.log(buttons);

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
          template: '<input type="number" ng-model="data.cash">',
          title: 'Declare Cash',
          // subTitle: 'Please use normal things',
          scope: $scope,
          buttons: buttons
        });

        myPopup.then(function(cash) {
          console.log(shift);
          var promise = null;
          if(cash == 'later'){
            ShiftService.declareCashLater(shift.Id).then(function(){
              self.shiftModal.hide();
              $scope.closeShiftOptionsModal();
              $scope.$emit('shift-changed');
            }, function(err){
              console.log(err);
            });
          } else {
            ShiftService.declareCash(cash, shift.Id).then(function(DocNo){
              self.shiftModal.hide();
              Report.printDeclareCash(shift, cash);

              Report.printShiftClosingReport(shift.Id);
              $scope.closeShiftOptionsModal();
              $scope.$emit('shift-changed');
            }, function(err){
              console.log(err);
            });;
          }

          promise
          // console.log('Tapped!', res);
        });
      }

      /**
       * Biding an event to catch modal close call
       */
      self.closeShiftModal = function () {
        self.shiftModal.hide();
      };

      $scope.$on('shift-exit', function(evt, shift){
        self.openShiftOpenModal();
      });

      $scope.$on('declare-cash', function(evt, shift){
        console.log(dayEnd);
        openCashPopUp(shift, dayEnd);
      });

      $scope.$on('shift-exit', function(evt, shift){
        // openCashPopUp()
      });

      $scope.$on('shift-close', function(evt, shift){
        openCashPopUp(shift);
      });

      $scope.$on('shift-modal-close', function(evt, success){
        // console.log($scope.shiftListType);
        // success(){
          self.closeShiftModal();
        // }
        // if($scope.shiftListType = type){
        //   self.closeShiftModal();
        // }
      });

      self.openDayEnd = function() {
        $q.all({
          declare: ShiftService.getDeclareCashShifts(),
          opened: ShiftService.getOpened(),
          cartEmpty: CartItemService.isEmpty()
        }).then(function (data) {
          if (!data.cartEmpty) {
            // dayEnd = true;
            Alert.showAlert('Warning!', 'Unsaved items should be saved before day end');
            return true;
          }

          if (data.declare.length > 0) {
            // dayEnd = true;
            Alert.showAlert('Warning!', 'Declare Cash before day end');
            return true;
          }

          console.log(data.cart);
          if (data.cart) {
            // dayEnd = true;
            Alert.showAlert('Warning!', 'Save order' +
              ' before day end');
            return true;
          }

          if (data.opened.length > 0) {
            // dayEnd = true;
            Alert.showAlert('Warning!', 'Close shifts before day end');
            return true;
          }

          ShiftService.dayEnd().then(function () {
            $scope.$emit('shift-changed');
            Report.printShiftClosingReport();
            Alert.showAlert('Success!', 'Day end completed').then(function(){
              $scope.closeShiftOptionsModal();
            });
          }, function (err) {
            console.log(err);
            dayEnd = false;
          });
        });
      }
    }]);
