/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('TenderCtrl', ['$scope', 'TenderService', 'BillService', 'AuthService', 'SettingsService', '$filter', 'FunctionsService', 'ControlService', '$ionicPopup', 'CartItemService',
    'DiscountService', '$ionicModal', 'RoundingService', 'Reciept', 'billData', '$state', '$rootScope', '$ionicHistory', '$stateParams', '$q', 'ItemService', 'denominations', 'Alert',
    function ($scope, TenderService, BillService, AuthService, SettingsService, $filter, FunctionsService, ControlService, $ionicPopup, CartItemService, DiscountService, $ionicModal, RoundingService,
              Reciept, billData, $state, $rootScope, $ionicHistory, $stateParams, $q, ItemService, denominations, Alert) {
    $scope.tenderTypes = [];
      $scope.title = "Tender";
      $scope.tenderHeader = billData.header;
      $scope.billItems = billData.items;
      var payTransactions = [];
      $scope.payTransactions = [];
      var businessDate = ControlService.getBusinessDate(true);
      var tenderDiscount = {
        header: null,
        discount: null
      };
      $scope.tenderTypes = billData.tenderTypes;
      $scope.functions = billData.functions;
      $scope.denominations = denominations;

      $scope.updatedRoundedTotal = 0;
      var submitted = false;

      $scope.$on("$ionicView.beforeEnter", function(event, data){
        submitted = false;
        initBill();
      });

      var initBill = function(){
        payTransactions = [];
        $scope.payTransactions = [];
        DiscountService.clearTenderDiscounts();
        $q.all({
          header: BillService.getHeader($stateParams.DocNo),
          items: CartItemService.getItems($stateParams.DocNo)
        }).then(function(data){
          if(data.header){
            $scope.header = ItemService.calculateTotal(data.header);
            $scope.header.TotalRounded = RoundingService.round(data.header.Total).toFixed(2) || 0 ;
            $scope.header.UpdatedTenderTotal = data.header.Total.toFixed(2) || 0 ;
            $scope.header.TenderTotal = data.header.Total.toFixed(2) || 0 ;
            $scope.header.UpdatedRoundedTotal = RoundingService.round(data.header.Total).toFixed(2);
            $scope.tenderHeader = $scope.header;
            $scope.billItems = data.items;
          }
        }).then(function(){
        });

      }

      // /**
      //  * Executes when modal is shown. Data initializations should be done inside this
      //  */
      // $scope.$on("modal.shown", function () {
      //   if($scope.shownModal == 'tender'){
      //
      //     var rec_id = BillService.getCurrentReceiptId();
      //     return BillService.getHeader(rec_id).then(function(header){
      //       $scope.tenderHeader = header;
      //       refreshData();
      //     });
      //   }
      // });

      $scope.$on("refresh-cart", function () {
        if($scope.shownModal == 'tender'){
          refreshData();
        }
      });

      var refreshData = function () {
        numpadValue = '';
        setValueManually = false;numpadValue = '';
        dotClicked = false;

        CartItemService.fetchItemsFromDb().then(function(bill) {
          $scope.billItems = bill;
          // BillService.getBillSummary(bill).then(function (summary) {
          // originalHeader = angular.copy(CartItemService.getSummery());
          // originalHeader.DocNo = TenderService.generateReceiptId();
          $scope.tenderHeader = CartItemService.getSummery($scope.tenderHeader);
          // $scope.tenderHeader = angular.copy(originalHeader);
          $scope.tenderHeader.TenderTotal = $scope.tenderHeader.Total.toFixed(2);
          // $scope.tenderHeader.TotalRounded = $scope.tenderHeader.Total.roundTo(2, .25).toFixed(2);
          $scope.tenderHeader.TotalRounded = RoundingService.round($scope.tenderHeader.Total).toFixed(2) || 0 ;
          $scope.updatedRoundedTotal = RoundingService.round($scope.tenderHeader.Total).toFixed(2);
          // console.log($scope.tenderHeader);

        }, function (er) {
          console.log(er);
        });
        payTransactions = [];
      }

      /**
       * Tells the sales controller to close the tender modal
       */
      $scope.modalClose = function () {
        $scope.$emit("close-tenderModel");
      }

      /**
       * Handles the tenderType click event
       * @param tenderType
       */
      var seq = 0;
      $scope.selectTenderType = function (tenderType, value) {
        if(!submitted){
          var overTender = false;
          var bill = _.map($scope.billItems, function (item) {
            item.IsExported = true;
            item.DocNo = $scope.tenderHeader.DocNo;
            item.StdCost = item.StdCost.roundTo(2);
            item.AlteredPrice = item.AlteredPrice.roundTo(2);
            item.SubTotal = item.SubTotal.roundTo(2);
            return item;
          });
          var item = _.first(bill);
          var total = $scope.tenderHeader.Total;
          var roundedTotal = parseFloat($scope.tenderHeader.TotalRounded);
          // var total = $scope.tenderHeader.TotalRounded;
          var amount = null;
          if(!$scope.tenderHeader.UpdatedTenderTotal){
            $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.Total;
          }
          if(value){
            amount = parseFloat(value).roundTo(2);
          } else if( (setValueManually && tenderType.TenderAmount == '0')){
            // if(){
            amount = parseFloat($scope.tenderHeader.UpdatedTenderTotal).roundTo(2);
            // } else {
            //   amount = parseFloat(tenderType.TenderAmount).roundTo(2)
            // }
          } else {
            amount = parseFloat(tenderType.TenderAmount != '0' ? tenderType.TenderAmount : total ).roundTo(2);
          }
          // var amount = ($scope.tenderHeader.UpdatedTenderTotal || setValueManually ? parseFloat($scope.tenderHeader.UpdatedTenderTotal) : parseFloat(tenderType.TenderAmount)).roundTo(2);
          // var amount = ($scope.tenderHeader.UpdatedTenderTotal || tenderType.Cash == 'true' || setValueManually ? parseFloat($scope.tenderHeader.UpdatedTenderTotal) : parseFloat(tenderType.TenderAmount)).roundTo(2);
          var diff = 0;

          if(tenderType.Round == 'true'){
            diff = ((total - roundedTotal)* -1).roundTo(2);
          }
          var changeAmount = 0;
          if (amount > roundedTotal) {
            changeAmount = (amount- (total+diff)).roundTo(2);
          }



          if(item){
            var transAmount = 0;
            // console.log(tenderType);
            if(value || (setValueManually && tenderType.TenderAmount == 0)){
              transAmount = parseFloat(value || $scope.tenderHeader.UpdatedTenderTotal);
            } else if(tenderType.Round == 'true'){
              transAmount = total + diff;
            } else {
              transAmount = amount;
            }

            if (roundedTotal <= amount) {
              submitted = true;
              // console.log(diff);
              if(tenderType.Round == 'true' && diff != 0 && !_.findWhere(payTransactions, {PayTypeId: -1})){
                payTransactions.push({
                  BusinessDate: businessDate,
                  LocationId: SettingsService.getLocationId(),
                  MachineId: SettingsService.getMachineId(),
                  DocNo: $scope.tenderHeader.DocNo,
                  Cash: tenderType.Cash == 'false',
                  SeqNo: seq++,
                  PayTypeId: -1,
                  Amount: diff,
                  ChangeAmount: 0,
                  ConvRate: 0,
                  CurrencyId: 0,
                  IsExported: false
                });
              }

              var stockTransactions = [];
              angular.forEach(bill, function (item, key) {
                stockTransactions.push({
                  BusinessDate: businessDate,
                  LocationId: item.LocationId,
                  LineNumber: item.LineNumber,
                  DocNo: $scope.tenderHeader.DocNo,
                  ItemId: item.ItemId,
                  SeqNo: 0,
                  DocType: "SA",
                  StdCost: item.StdCost,
                  Qty: item.Qty,
                  BaseUOMId: 1,
                  IsExported: false

                });
              });
              var header = _.omit($scope.tenderHeader, ["TaxAmount", "Total", "TenderTotal", "TotalRounded"]);

              var total = 0;
              angular.forEach(payTransactions, function (tx) {
                total += parseFloat(tx.Amount);
              });

              if (total > $scope.tenderHeader.Total && tenderType.OverTender == 'true') {
                overTender = {
                  BusinessDate: businessDate,
                  LocationId: SettingsService.getLocationId(),
                  MachineId: SettingsService.getMachineId(),
                  DocNo: $scope.tenderHeader.DocNo,
                  PayTypeId: tenderType.Id,
                  OverTenderTypeId: tenderType.OverTenderTypeId,
                  SeqNo: 0,
                  Amount: amount,
                  ChangeAmount: changeAmount || 0,
                  IsExported: false
                };
              }

              DiscountService.saveTenderDiscount($scope.tenderHeader.DocNo).then(function(){
                BillService.saveBill(header, bill, stockTransactions, payTransactions, overTender).then(function () {
                  ControlService.counterDocId($scope.tenderHeader.DocNo);
                  BillService.initHeader();
                  payTransactions = [];
                  overTender = [];

                  numpadValue = "";
                  setValueManually = false;
                  if(tenderType.OpenDrawer == 'true'){
                    Reciept.openDrawer();
                  }
                  Reciept.print(header.DocNo);


                  if(changeAmount > 0 && tenderType.Cash == 'true'){
                    $ionicPopup.alert({
                      title: 'Change',
                      template: '<p style="font-size: 18px; text-align: center;">$'+ changeAmount.toFixed(2)+'</p>'
                    });
                  }
                  $ionicHistory.nextViewOptions({
                    disableAnimate: false,
                    disableBack: true
                  });

                  $rootScope.$emit("initBill");
                  $rootScope.$emit("refresh-cart");
                  $state.go('app.sales', {}, {reload: true});

                }, function (err) {
                  console.log(err);
                });
              });
            } else {
              $scope.tenderHeader.Total = (total - amount).roundTo(2);
              $scope.tenderHeader.TenderTotal = $scope.tenderHeader.Total.toFixed(2);
              $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.Total.toFixed(2);
              $scope.tenderHeader.TotalRounded = RoundingService.round($scope.tenderHeader.Total).toFixed(2);
            }

            payTransactions.push({
              BusinessDate: businessDate,
              LocationId: SettingsService.getLocationId(),
              MachineId: SettingsService.getMachineId(),
              DocNo: $scope.tenderHeader.DocNo,
              Cash: tenderType.Cash == 'true',
              SeqNo: seq,
              PayTypeId: tenderType.Id,
              Amount: transAmount,
              ChangeAmount: changeAmount || 0,
              ConvRate: 0,
              CurrencyId: 0,
              IsExported: false
            });
            $scope.payTransactions.push({
              Desc1: tenderType.Description1,
              Desc2: tenderType.Description2,
              Amount: transAmount
            });
          }
          seq++;
          $scope.numpadClear();
        }

      }

      /**
       * Initiating discount modal dialog
       */
      $ionicModal.fromTemplateUrl('main/tenderDiscount/discount.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.discountModal = modal;
      });

      /**
       * Initiating discount modal dialog
       */
      $ionicModal.fromTemplateUrl('main/tender/paymentsMade.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.paymentsMadeModal = modal;
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('discountModel-close', function () {
        $scope.discountModal.hide();
      });

      /**
       * Invokes the given named function from $scope.tenderFunctions
       * @param name
       */
      $scope.invoke = function (name) {
        if (!_.isUndefined($scope.tenderFunctions[name])) {
          $scope.tenderFunctions[name]();
        } else {
          throw new Error("Function " + name + " is not available.");
        }
      };

      /**
       * Contains the list of functions for tender
       * @type {}
       */
      $scope.tenderFunctions = {
        Redemption: function () {
          console.log("Redemption");
        },
        Discount: function (fn) {
          if(payTransactions.length == 0){
            $scope.shownModal = 'tenderDiscounts';
            $scope.discountModal.show();
          }


        },
        PaymentMade: function(fn){
          $scope.paymentsMadeModal.show();
        },
        TenderStaff: function(){

        }
      };

      var numpadValue = '';
      var setValueManually = false;
      var dotClicked = false;
      /**
       * Handles the number-pad click events
       * @param value
       */
      $scope.numpadClick = function (value) {
        numpadValue += value;
        var temp = numpadValue;
        if(!$scope.tenderHeader.UpdatedTenderTotal){
          $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.TenderTotal;
        }

        if (dotClicked) {
          var index = $scope.tenderHeader.UpdatedTenderTotal.indexOf('.');
          var tail = $scope.tenderHeader.UpdatedTenderTotal.substr(index + 1, $scope.tenderHeader.UpdatedTenderTotal.length - index);
          if (parseFloat(tail.substr(1, 1)) >= 1) {
            return;
          }
          if (tail == '00') {
            $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.UpdatedTenderTotal.substr(0, $scope.tenderHeader.UpdatedTenderTotal.indexOf('.') + 1) + value + "0";
          } else {
            $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.UpdatedTenderTotal.substr(0, $scope.tenderHeader.UpdatedTenderTotal.indexOf('.') + 2) + value;
          }
          return;
        }

        if (temp.length == 1) {
          $scope.tenderHeader.UpdatedTenderTotal  = temp = "0.0" + temp;
        } else if (temp.length == 2) {
          $scope.tenderHeader.UpdatedTenderTotal = temp = "0." + temp;
        } else if (temp.length >= 3) {
          var last = temp.substr(temp.length - 2, 2);
          var first = temp.substr(0, temp.length - 2);
          $scope.tenderHeader.UpdatedTenderTotal = first + "." + last;
        }

        setValueManually = true;
      }

      $scope.numpadDotClick = function () {
        if(!$scope.tenderHeader.UpdatedTenderTotal){
          $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.TenderTotal;
        }
          if(!dotClicked && numpadValue != ''){
            numpadValue = parseInt(numpadValue || 0) + '.00';
            $scope.tenderHeader.UpdatedTenderTotal = numpadValue;
            dotClicked = true;
          }
      }

      /**
       * Clears the number-pad input
       */
      $scope.numpadClear = function () {
        if (setValueManually) {
          $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.Total.toFixed(2);
          numpadValue = "";
          dotClicked = false;
          setValueManually = false;
        }
      }

      /**
       * To store the function which was running until the authority check failed
       * @type {}
       */
      var onGoingFunction = null;

      /**
       * check whether current user has rights to access the given function and if not login window for temp user is popped up
       * @param Function fn
       * @returns {boolean}
       */
      var authorityCheck = function (fn) {
        var authorized = false;
        var tempUser = AuthService.getTempUser();
        if(tempUser){
          if(AuthService.isAuthorized(fn.AccessLevel, tempUser)){
            authorized = true;
          }
        } else {
          if(AuthService.isAuthorized(fn.AccessLevel, AuthService.currentUser())){
            authorized = true;
          } else {
            $scope.LoginlModal.show();
            onGoingFunction = fn;
          }
        }

        // TODO: move this to function block
        AuthService.setTempUser(null);
        return authorized;
      }

      $scope.close = function () {
        $state.go('app.sales', {}, {reload: true});
      }

      $scope.closePaymentsModal = function () {
        $scope.paymentsMadeModal.hide();
      }

      $scope.$on('discountModel-close', function () {
        // console.log($scope.tenderHeader);
        $scope.updatedRoundedTotal = $scope.tenderHeader.UpdatedRoundedTotal;
        tenderDiscount.header = angular.copy($scope.tenderHeader);
        // originalHeader.Total = tenderDiscount.header.Total
        //TODO comeup with a plan to capture selected discount
        // tenderDiscount.discount = angular.copy($scope.tenderHeader);
      });

      $scope.addDenomination = function(value){
        var cashId = SettingsService.getCashId();
        // console.log(cashId);
        TenderService.getTenderTypeById(cashId).then(function (tenderType) {
          if(tenderType){
            $scope.selectTenderType(tenderType, value);
          } else {
            Alert.error('Incorrect Cash ID configured. Please contact administrator');
          }
        });
      }

    }]);
