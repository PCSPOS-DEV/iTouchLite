/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('TenderCtrl', ['$scope', 'TenderService', 'BillService', 'AuthService', 'SettingsService', '$filter', 'FunctionsService', 'ControlService', '$ionicPopup', 'CartItemService', 'LogService',
    'DiscountService', '$ionicModal', 'RoundingService', 'Reciept', 'billData', '$state', '$rootScope', '$ionicHistory', '$stateParams', '$q', 'ItemService', 'denominations', '$ionicScrollDelegate', 'Alert', 'Restangular', 'AppConfig', '$timeout',
    function ($scope, TenderService, BillService, AuthService, SettingsService, $filter, FunctionsService, ControlService, $ionicPopup, CartItemService, LogService, DiscountService, $ionicModal, RoundingService,
              Reciept, billData, $state, $rootScope, $ionicHistory, $stateParams, $q, ItemService, denominations, $ionicScrollDelegate, Alert, Restangular, AppConfig, $timeout) {
      $scope.tenderTypes = [];
      $scope.title = 'Tender';
      $scope.tenderHeader = billData.header;
      $scope.billItems = billData.items;
      var payTransactions = [];
      $scope.payTransactions = [];
      var businessDate = ControlService.getBusinessDate(true);
      var sitems = 0;
      var fditem;
      var fitems = ItemService.fetchDate().then(function (res) {
        fditem = res;
        return fditem;
      });
      var tenderDiscount = {
        header: null,
        discount: null
      };
      $scope.tenderTypes = billData.tenderTypes;
      $scope.functions = billData.functions;
      $scope.denominations = denominations;

      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();

      $scope.updatedRoundedTotal = 0;
      var submitted = false;
      $scope.modals = {
        loginModal: null
      };

      $scope.$on('$ionicView.beforeEnter', function (event, data) {
        submitted = false;
        DiscountService.clearTempTenderDiscounts();
        initBill();
        syncItem();
      });

      var syncItem = function () {
        Restangular.one('GetItemsByLocations').get({LocationId: SettingsService.getLocationId()}).then(function (res) {
          items = JSON.parse(res);
          sitems = items;
        });
      };

      var initBill = function () {
        try {
          eventLog.log('Tender initBill Start');
          //console.log($stateParams.DocNo);
          payTransactions = [];
          $scope.payTransactions = [];
          DiscountService.clearTenderDiscounts();
          $q.all({
            header: BillService.getTempHeader($stateParams.DocNo),
            items: CartItemService.getItems($stateParams.DocNo)
          }).then(function (data) {
            if (data.header) {
              /*Yi Yi Po (25-07-2017)*/
              //data.header.DiscAmount=data.header.DiscAmount-(data.header.Tax1DiscAmount + data.header.Tax2DiscAmount + data.header.Tax3DiscAmount+ data.header.Tax4DiscAmount + data.header.Tax5DiscAmount);
              /*---*/

              $scope.header = ItemService.calculateTotal(data.header);
              $scope.header.CashierId = AuthService.currentUser().Id;
              $scope.header.TotalRounded = RoundingService.round(data.header.Total).toFixed(2) || 0 ;
              $scope.header.UpdatedTenderTotal = data.header.Total.toFixed(2) || 0 ;
              $scope.header.TenderTotal = data.header.Total.toFixed(2) || 0 ;
              $scope.header.UpdatedRoundedTotal = RoundingService.round(data.header.Total).toFixed(2);
              $scope.tenderHeader = $scope.header;
              $scope.billItems = _.map(data.items, function (item) {
                if (item.SuspendDepDocNo) {
                  $scope.header.isSuspended = true;
                  $scope.header.SuspendDocNo = item.SuspendDepDocNo;
                }
                return item;
              });
            }
          }).then(function () {
            eventLog.log('Tender initBill Complete');
          });
        } catch (ex) {
          errorLog.log('Tender initBill Error : ' + ex);
          console.log(ex);
        }
        LogService.SaveLog();
      };

      $scope.$on('refresh-cart', function () {
        if ($scope.shownModal == 'tender') {
          refreshData();
        }
      });

      var refreshData = function () {
        eventLog.log('Tender refreshData Start');
        numpadValue = '';
        setValueManually = false;numpadValue = '';
        dotClicked = false;

        CartItemService.fetchItemsFromDb().then(function (bill) {

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
          eventLog.log('Tender refreshData Complete');
        }, function (er) {
          errorLog.log('Tender refreshData Error : ' + er);
          console.log(er);
        });
        LogService.SaveLog();
        payTransactions = [];
      };

      /**
       * Handles the tenderType click event
       * @param tenderType
       */
      var seq = 0;
      $scope.selectTenderType = function (tenderType, value) {
        eventLog.log('Tender Operation Start');
        try {
          if (!submitted) {
            var overTender = false;

            var bill = _.map($scope.billItems, function (item) {
              item.IsExported = true;
              item.DocNo = $scope.tenderHeader.DocNo;
              item.StdCost = item.StdCost.roundTo(2);
              item.AlteredPrice = item.AlteredPrice.roundTo(2);
              item.SubTotal = item.SubTotal.roundTo(2);
              return item;
            });
            eventLog.log('Tender Bill : ');eventLog.log(bill);
            var item = _.first(bill);
            var total = $scope.tenderHeader.Total;
            var roundedTotal = parseFloat($scope.tenderHeader.TotalRounded);
            // var total = $scope.tenderHeader.TotalRounded;

            var amount = null;
            if (!$scope.tenderHeader.UpdatedTenderTotal) {
              $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.Total;
            }
            if (value) {
              amount = parseFloat(value).roundTo(2);
            } else if ( (setValueManually && tenderType.TenderAmount == '0')) {
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
            eventLog.log('Tender Round Start');
            if (tenderType.Round == 'true') {
              diff = ((total - roundedTotal) * -1).roundTo(2);
            }
            var changeAmount = 0;


            if (item) {
              var transAmount = 0;
              // console.log(tenderType);
              if (value || (setValueManually && tenderType.TenderAmount == 0)) {
                transAmount = parseFloat(value || $scope.tenderHeader.UpdatedTenderTotal);
              } else if (tenderType.Round == 'true') {
                transAmount = total + diff;
              } else {
                transAmount = amount;
              }
              transAmount = transAmount.roundTo(2);


              if (transAmount > roundedTotal) {
                changeAmount = (transAmount - (total + diff)).roundTo(2);
              }
              eventLog.log('Tender currentTenderTotal Start');
              var currentTenderTotal = (total - amount).roundTo(2);
              //if (roundedTotal <= transAmount || (roundedTotal < 0 &&  roundedTotal >= transAmount) )
              if (currentTenderTotal == 0 || roundedTotal <= transAmount || (roundedTotal < 0 &&  roundedTotal >= transAmount) )
              {
                submitted = true;
                // console.log(diff);
                if (tenderType.Round == 'true' && diff != 0 && !_.findWhere(payTransactions, {PayTypeId: -1})) {
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
                var ItemUOMId;
                var stockTransactions = [];
                angular.forEach(bill, function (item, key) {
                  angular.forEach(fditem, function (fitem, key) {
                    if (fitem.Id == Math.floor(item.ItemId)) {
                      ItemUOMId = fitem.UOM_Id;
                      stockTransactions.push({
                        BusinessDate: businessDate,
                        LocationId: item.LocationId,
                        MachineId: item.MachineId,
                        LineNumber: item.LineNumber,
                        DocNo: $scope.tenderHeader.DocNo,
                        ItemId: Math.floor(item.ItemId),
                        SeqNo: 1,
                        DocType: 'SA',
                        StdCost: item.StdCost,
                        Qty: item.Qty,
                        BaseUOMId: ItemUOMId,
                        IsExported: false

                      });
                    }
                  });
                });
                eventLog.log('Tender stockTransactions Detail');
                var header = _.omit($scope.tenderHeader, ['TaxAmount', 'Total', 'TenderTotal', 'TotalRounded']);

                // var total = 0;
                // angular.forEach(payTransactions, function (tx) {
                //   total += parseFloat(tx.Amount);
                // });

                if (transAmount > roundedTotal && tenderType.OverTender == 'true') {
                  var OverTenderAmount = (transAmount - roundedTotal).roundTo(2);
                  if (SettingsService.getCashId() != tenderType.Id) {
                    OverTenderAmount = (transAmount - $scope.tenderHeader.UpdatedTenderTotal).roundTo(2);
                  }
                  if (OverTenderAmount != 0) {
                    var payOverTenderAmount = OverTenderAmount;
                    var payOverChangeAmount = 0;
                    if (tenderType.OverTenderTypeId == 3) {
                      payOverTenderAmount = roundedTotal;
                      payOverChangeAmount = OverTenderAmount;
                    }
                    overTender = {
                      BusinessDate: businessDate,
                      LocationId: SettingsService.getLocationId(),
                      MachineId: SettingsService.getMachineId(),
                      DocNo: $scope.tenderHeader.DocNo,
                      PayTypeId: tenderType.Id,
                      OverTenderTypeId: tenderType.OverTenderTypeId,
                      SeqNo: 1,
                      Amount: payOverTenderAmount,
                      ChangeAmount: payOverChangeAmount,
                      //Amount:OverTenderAmount,
                      //ChangeAmount: 0,
                      IsExported: false
                    };
                  }
                  eventLog.log('Tender OverTenderAmount Detail');
                }

                if ($scope.header.isSuspended) {
                  var outletUrl = AppConfig.getOutletServerUrl();
                  eventLog.log('Tender $scope.header.isSuspended');
                //  $scope.header.SuspendDocNo
                  if (outletUrl) {
                    Restangular.oneUrl('DeleteSuspendBill', outletUrl + 'DeleteSuspendBill').get({ SuspendDocNo: $scope.header.SuspendDocNo }).then(function (res) {
                      if (res == 'success') {
                        return true;
                      } else {
                        return $q.reject('Invalid service');
                      }
                    });
                  }

                } else {
                  eventLog.log('Tender $scope.header.isSuspended False');
                }
                DiscountService.saveTenderDiscount($scope.tenderHeader.DocNo).then(function () {

                  BillService.saveBill(header, bill, stockTransactions, payTransactions, overTender).then(function () {
                    eventLog.log('counterDocId : ' + $scope.tenderHeader.DocNo);
                    ControlService.counterDocId($scope.tenderHeader.DocNo);
                    BillService.initHeader();
                    payTransactions = [];
                    overTender = [];

                    numpadValue = '';
                    setValueManually = false;
                    if (tenderType.OpenDrawer == 'true') {
                      Reciept.openDrawer();
                    }
                    // console.log(tenderType.TotalPrintReceipt);
                    for (var i = 1; i < tenderType.TotalPrintReceipt; i++) { // TotalPrintReceipt Control
                      eventLog.log('print receipt ');
                      Reciept.print(header.DocNo);
                    }
                    // Reciept.print(header.DocNo);


                    if (changeAmount > 0 && tenderType.Cash == 'true') {
                      $ionicPopup.alert({
                        title: 'Change',
                        template: '<p style="font-size: 18px; text-align: center;">$' + changeAmount.toFixed(2) + '</p>'
                      });
                    }
                    $ionicHistory.nextViewOptions({
                      disableAnimate: false,
                      disableBack: true
                    });
                    eventLog.log('initBill & refresh-cart ');

                    $rootScope.$emit('initBill');
                    $rootScope.$emit('refresh-cart', true);
                    $state.go('app.sales', {}, {reload: true});

                  }, function (err) {
                    errorLog.log('setImages saveTenderDiscount Error : ' + err);
                    console.log(err);
                  });
                  eventLog.log('Tender saveTenderDiscount Complete');
                });
              }
              else {
                $scope.tenderHeader.Total = (total - amount).roundTo(2);
                $scope.tenderHeader.TenderTotal = $scope.tenderHeader.Total.toFixed(2);
                $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.Total.toFixed(2);
                $scope.tenderHeader.TotalRounded = RoundingService.round($scope.tenderHeader.Total).toFixed(2);
              }
              eventLog.log('Tender currentTenderTotal Complete');

              var payTransAmount = transAmount;
              if (tenderType.OverTenderTypeId == 3) {
                if (tenderType.Round == 'true') {
                  if (setValueManually == false) {
                    payTransAmount = roundedTotal;
                  }
                  else {
                    if (transAmount > roundedTotal) {
                      payTransAmount = roundedTotal;
                    }
                  }
                }
              }
              if (value)
              {
                if (value > payTransAmount)
                  {payTransAmount += 0;}
                else
                  {payTransAmount = value;}
              }

              payTransactions.push({
                BusinessDate: businessDate,
                LocationId: SettingsService.getLocationId(),
                MachineId: SettingsService.getMachineId(),
                DocNo: $scope.tenderHeader.DocNo,
                Cash: tenderType.Cash == 'true',
                SeqNo: seq,
                PayTypeId: tenderType.Id,
                //Amount: transAmount,
                Amount: payTransAmount,
                ChangeAmount: tenderType.Cash == 'true' ? changeAmount || 0 : 0,
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
            eventLog.log('--*-- Tender Operation Complete --*--');
            $scope.$emit('BlockMenu', true);
          } else {
            eventLog.log('--*-- Tender Operation Fail :' + submitted + '--*--');
          }
        } catch (err) {
          eventLog.log('--*-- Tender Operation Error :' + err + '--*--');
        }
        LogService.SaveLog();
      };

      /**
       * Invokes the given named function from $scope.tenderFunctions
       * @param name
       */
      $scope.invoke = function (fn) {
        if (!_.isUndefined($scope.tenderFunctions[fn.Name])) {
          $scope.tenderFunctions[fn.Name](fn);
        } else {
          errorLog.log('Function ' + fn.Name + ' is not available.');
          throw new Error('Function ' + fn.Name + ' is not available.');
        }
      };

      /**
       * Contains the list of functions for tender
       * @type {}
       */
      $scope.tenderFunctions = {
        Redemption: function () {
          console.log('Redemption');
        },
        Discount: function (fn) {
          if (authorityCheck(fn)) {
             /*Yi Yi Po(24/07/2017)*/
            $ionicScrollDelegate.scrollTop();
            /*--*/
            if (payTransactions.length == 0) {
              $scope.shownModal = 'tenderDiscounts';
              $scope.discountModal.show();
            }
          }

        },
        PaymentMade: function (fn) {
          if (authorityCheck(fn)) {
            $scope.paymentsMadeModal.show();
          }
        },
        TenderStaff: function () {

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
        if (!$scope.tenderHeader.UpdatedTenderTotal) {
          $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.TenderTotal;
        }

        if (dotClicked) {
          var index = $scope.tenderHeader.UpdatedTenderTotal.indexOf('.');
          var tail = $scope.tenderHeader.UpdatedTenderTotal.substr(index + 1, $scope.tenderHeader.UpdatedTenderTotal.length - index);
          if (parseFloat(tail.substr(1, 1)) >= 1) {
            return;
          }
          if (tail == '00') {
            $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.UpdatedTenderTotal.substr(0, $scope.tenderHeader.UpdatedTenderTotal.indexOf('.') + 1) + value + '0';
          } else {
            $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.UpdatedTenderTotal.substr(0, $scope.tenderHeader.UpdatedTenderTotal.indexOf('.') + 2) + value;
          }
          return;
        }

        if (temp.length == 1) {
          $scope.tenderHeader.UpdatedTenderTotal  = temp = '0.0' + temp;
        } else if (temp.length == 2) {
          $scope.tenderHeader.UpdatedTenderTotal = temp = '0.' + temp;
        } else if (temp.length >= 3) {
          var last = temp.substr(temp.length - 2, 2);
          var first = temp.substr(0, temp.length - 2);
          $scope.tenderHeader.UpdatedTenderTotal = first + '.' + last;
        }

        setValueManually = true;
      };

      $scope.numpadDotClick = function () {
        if (!$scope.tenderHeader.UpdatedTenderTotal) {
          $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.TenderTotal;
        }
        if (!dotClicked && numpadValue != '') {
          numpadValue = parseInt(numpadValue || 0) + '.00';
          $scope.tenderHeader.UpdatedTenderTotal = numpadValue;
          dotClicked = true;
        }
      };

      /**
       * Clears the number-pad input
       */
      $scope.numpadClear = function () {
        if (setValueManually) {
          $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.Total.toFixed(2);
          numpadValue = '';
          dotClicked = false;
          setValueManually = false;
        }
      };

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
      var modalOpen = false;
      var authorityCheck = function (fn) {
        var authorized = false;
        var tempUser = AuthService.getTempUser();
        if (tempUser) {
          if (AuthService.isAuthorized(fn.AccessLevel, tempUser)) {
            authorized = true;
          }
          else {
            Alert.warning('Access denied!');
          }
        } else {
          if (AuthService.isAuthorized(fn.AccessLevel, AuthService.currentUser())) {
            authorized = true;
          } else {
            if (!modalOpen) {
              $timeout(function () {
                $scope.modals.loginlModal.show();
                modalOpen = true;
              }, 500);
              //$scope.modals.loginlModal.show();
              onGoingFunction = fn;
            }
          }
        }

        // TODO: move this to function block
        AuthService.setTempUser(null);
        return authorized;
      };

      $scope.close = function () {
        /*Yi Yi Po(25-07-2017)*/
        DiscountService.clearTempTenderDiscounts();
        /*---*/
        $state.go('app.sales', {}, {reload: true});
      };

      $scope.closePaymentsModal = function () {
        $scope.paymentsMadeModal.hide();
      };

      $scope.$on('discountModel-close', function () {
        // console.log($scope.tenderHeader);
        $scope.updatedRoundedTotal = $scope.tenderHeader.UpdatedRoundedTotal;
        tenderDiscount.header = angular.copy($scope.tenderHeader);
        // originalHeader.Total = tenderDiscount.header.Total
        //TODO comeup with a plan to capture selected discount
        // tenderDiscount.discount = angular.copy($scope.tenderHeader);
      });

      $scope.addDenomination = function (value) {
        var cashId = SettingsService.getCashId();
        eventLog.log('addDenomination Start: ');
        // console.log(cashId);
        TenderService.getTenderTypeById(cashId).then(function (tenderType) {
          if (tenderType) {
            eventLog.log('addDenomination Finish: ');
            $scope.selectTenderType(tenderType, value);
          } else {
            errorLog.log('Incorrect Cash ID configured. Please contact administrator');
            Alert.error('Incorrect Cash ID configured. Please contact administrator');
          }
        });
        LogService.SaveLog();
      };

      /* Modals */

        /**
         * Initiating shift modal dialog
         */
      $ionicModal.fromTemplateUrl('main/login/loginModal.html', {
        id: 12,
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modals.loginlModal = modal;

      });

        /**
         * Biding an event to catch modal close call
         */
      $scope.$on('loginlModal-close', function (modal, close) {
        $scope.modals.loginlModal.hide();
        modalOpen = false;
        if (close) {
          onGoingFunction = false;
        }
            // console.log(AuthService.getTempUser());
        if (onGoingFunction) {
          $scope.invoke(onGoingFunction);
        }
      });

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

    }]);
