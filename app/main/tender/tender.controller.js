/**
 * Created by shalitha on 3/6/16.
 */
angular.module('itouch.controllers')
  .controller('TenderCtrl', ['$scope', 'TenderService', 'BillService', 'AuthService', 'SettingsService', '$filter', 'FunctionsService', 'ControlService', '$ionicPopup', 'CartItemService', 'DiscountService', '$ionicModal', 'RoundingService', 'Reciept',
    function ($scope, TenderService, BillService, AuthService, SettingsService, $filter, FunctionsService, ControlService, $ionicPopup, CartItemService, DiscountService, $ionicModal, RoundingService, Reciept) {
      $scope.tenderTypes = [];
      $scope.title = "Tender";
      $scope.tenderHeader = {
        DiscAmount: 0,
        DocNo: "",
        Pax: 0,
        SubTotal: 0,
        Tax1Amount: 0,
        Tax1DiscAmount: 0,
        Tax2Amount: 0,
        Tax2DiscAmount: 0,
        Tax3Amount: 0,
        Tax3DiscAmount: 0,
        Tax4Amount: 0,
        Tax4DiscAmount: 0,
        Tax5Amount: 0,
        Tax5DiscAmount: 0,
        TaxAmount: 0,
        Total: 0,
        TotalRounded: 0,
        Disocunt: 0
      };
      var payTransactions = [];
      var businessDate = $filter('date')(ControlService.getBusinessDate(), "yyyy-MM-dd");
      var tenderDiscount = {
        header: null,
        discount: null
      };

      $scope.updatedRoundedTotal = 0;

      TenderService.getTenderTypes().then(function (types) {
        $scope.tenderTypes = types;
      });

      FunctionsService.getTenderFunctions().then(function (fns) {
        $scope.functions = {
          top: _.where(fns, {DisplayOnTop: "true"}),
          bottom: _.where(fns, {DisplayOnTop: "false"})
        }
      });

      /**
       * Executes when modal is shown. Data initializations should be done inside this
       */
      $scope.$on("modal.shown", function () {
        if($scope.shownModal == 'tender'){

          BillService.getHeader().then(function(header){
            $scope.tenderHeader = header;
            refreshData();
          });
        }
      });

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
        $scope.$emit("tenderModel-close");
      }

      /**
       * Handles the tenderType click event
       * @param tenderType
       */
      var seq = 0;
      $scope.selectTenderType = function (tenderType) {
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
        var amount = (tenderType.Cash == 'true' || setValueManually ? parseFloat($scope.tenderHeader.TenderTotal) : parseFloat(tenderType.TenderAmount)).roundTo(2);
        var changeAmount = 0;
        if (amount > total) {
          changeAmount = (amount - total).roundTo(2);
        }
        var diff = (($scope.tenderHeader.Total - parseFloat($scope.tenderHeader.TotalRounded))* -1).roundTo(2);
        // console.log(diff);
        if(diff != 0 && !_.findWhere(payTransactions, {PayTypeId: -1})){
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
            IsExported: true
          });
        }

        if(item){
          var transAmount = 0;
          // console.log(tenderType);
          if(tenderType.Round == 'true'){
            transAmount = total + diff;
          } else {
            transAmount = amount;
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
            ChangeAmount: changeAmount,
            ConvRate: 0,
            CurrencyId: 0,
            IsExported: true
          });

          if (total <= amount) {

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
                IsExported: true

              });
            });
            var header = _.omit($scope.tenderHeader, ["TaxAmount", "Total", "TenderTotal", "TotalRounded"]);
            // header.DocType = TenderService.getDocType();
            // header.LocationId = SettingsService.getLocationId();
            // header.MachineId = SettingsService.getMachineId();
            // header.BusinessDate = businessDate;
            // header.SysDateTime = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
            // header.ShiftId = AuthService.getShift().Id;
            // header.AuthBy = 0;
            // header.VipId = 0;
            // header.CashierId = AuthService.currentUser().Id;
            // header.TableId = 0;
            // header.DepAmount = 0;
            // header.VoidDocNo = 0;
            // header.ReprintCount = 0;
            // header.OrderTag = "";
            // header.Remarks = "";
            // header.IsExported = true;
            // header.IsClosed = true;
            //
            // header.Tax1Option = item.Tax1Option;
            // header.Tax1Perc = item.Tax1Perc;
            // header.Tax2Option = item.Tax2Option;
            // header.Tax2Perc = item.Tax2Perc;
            // header.Tax3Option = item.Tax3Option;
            // header.Tax3Perc = item.Tax3Perc;
            // header.Tax4Option = item.Tax4Option;
            // header.Tax4Perc = item.Tax4Perc;
            // header.Tax5Option = item.Tax5Option;
            // header.Tax5Perc = item.Tax5Perc;


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
                ChangeAmount: changeAmount,
                IsExported: true
              };
            }

            DiscountService.saveTenderDiscount().then(function(){
              BillService.saveBill(header, bill, stockTransactions, payTransactions, overTender).then(function () {
                BillService.saveReceiptId($scope.tenderHeader.DocNo);
                BillService.initHeader().then(function(header){

                });
                payTransactions = [];
                overTender = [];
                $scope.$emit("tenderModel-close");
                $scope.$emit("refresh-cart");
                Reciept.print(header.DocNo);
                $ionicPopup.alert({
                  title: 'Balance',
                  template: '<p>Balance: $'+ changeAmount.toFixed(2) + '</p><p>Rounded Balance: $'+ changeAmount.roundTo(2, .25).toFixed(2) +'</p>'
                }).then(function () {
                });
                numpadValue = "";
                setValueManually = false;
              }, function (err) {
                console.log(err);
              });
            });
          } else {
            $scope.tenderHeader.Total = (total - amount).roundTo(2);
            $scope.tenderHeader.TenderTotal = $scope.tenderHeader.Total.toFixed(2);
            $scope.updatedRoundedTotal = RoundingService.round($scope.tenderHeader.Total).toFixed(2);
          }
        }
        seq++;
      }

      /**
       * Initiating discount modal dialog
       */
      $ionicModal.fromTemplateUrl('main/tender.discount/discount.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.discountModal = modal;
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
        console.log(name);
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
          $scope.discountModal.show();

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
        $scope.$emit("tenderModel-close");
      }

      $scope.$on('discountModel-close', function () {
        console.log($scope.tenderHeader);
        // $scope.updatedRoundedTotal = $scope.tenderHeader.updatedRoundedTotal;
        // tenderDiscount.header = angular.copy($scope.tenderHeader);
        // originalHeader.Total = tenderDiscount.header.Total
        //TODO comeup with a plan to capture selected discount
        // tenderDiscount.discount = angular.copy($scope.tenderHeader);
      });

    }]);
