/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('SalesCtrl', ['$scope', 'KeyBoardService', '$timeout', 'ItemService', 'SubPLU1Service', 'SubPLU2Service', 'SubPLU3Service', 'PriceGroupService', '$ionicModal', '$http', 'SettingsService',
    'AuthService', 'CartItemService', 'ControlService', 'ionicDatePicker', 'FunctionsService', '$filter', 'SalesKitService', 'DiscountService', 'BillService', 'ShiftService',
    'PWPService', '$ionicScrollDelegate', 'Alert', '$q', '$ionicPopup', 'header', 'user', 'shift', '$state', '$rootScope', 'Reciept', '$cordovaToast', 'SuspendService', 'AppConfig', 'Restangular',
    function ($scope, KeyBoardService, $timeout, ItemService, SubPLU1Service, SubPLU2Service, SubPLU3Service, PriceGroupService, $ionicModal, $http, SettingsService,
              AuthService, CartItemService, ControlService, ionicDatePicker, FunctionsService, $filter, SalesKitService, DiscountService, BillService, ShiftService,
              PWPService, $ionicScrollDelegate, Alert, $q, $ionicPopup, header, user, shift, $state, $rootScope, Reciept, $cordovaToast, SuspendService, AppConfig, Restangular) {
      $scope.showpwpModal = false;
      $scope.showskModalModal = false;
      debugLog = SettingsService.StartDebugLog();
      $scope.header = header;
      $scope.keys = [];
      $scope.layout = null;
      $scope.key = {};
      $scope.SubPLUList = [];
      $scope.modalData = {};
      $scope.cart = {};
      $scope.user = user;
      $scope.tempUser = null;
      $scope.salesKitUpdate = false;
      var numpadValue = '';
      var setValueManually = false;
      var temp = 0;
      var submitted = false;
      var businessDate = ControlService.getBusinessDate(true);
      var Suspended = false;
      var request = new XMLHttpRequest();
      var requestUrl = AppConfig.getDisplayUrl();
      var ApiArray = new Array();
      var TempDeleteItem = null;
      var UpData;
      var control = 0;
      $scope.salesKits = {
        list: {},
        selectedList: {},
        selected: {}
      };
      $scope.shownModal = null;
      $scope.modalCloseDisabled = false;
      $scope.pwp = null;
      $scope.qty = {value: 1};
      $scope.modals = {
        modifiers: null,
        salesKit: null
      };
      $scope.TakeAway = false;
      $scope.shift = shift;
      $scope.data = {
        amount: '',
        barcodeMode: false
      };
      var buttonClicked = {
        voidBill: false,
        barcode: false
      };
      keys = {};
      $scope.keyboard = {
        pages: [],
        activePage: null,
        keys: {},
        activeKeys: {}
      };

      // $scope.numberPickerObject = {
      //   inputValue: 1, //Optional
      //   minValue: 1,
      //   maxValue: 50,
      //   precision: 3,  //Optional
      //   decimalStep: 0.25,  //Optional
      //   format: 'WHOLE',  //Optional - "WHOLE" or "DECIMAL"
      //   unit: '',  //Optional - "m", "kg", "℃" or whatever you want
      //   titleLabel: 'Set Qty',  //Optional
      //   setLabel: 'Set',  //Optional
      //   closeLabel: 'Close',  //Optional
      //   setButtonType: 'button-positive',  //Optional
      //   closeButtonType: 'button-stable',  //Optional
      //   callback: function (val) {    //Mandatory
      //     if (val) {
      //       $scope.qty.value = val;
      //     } else {
      //       $scope.qty.value = 1;
      //     }
      //   }
      // };


      /**
       * Initiating shift modal dialog
       */
      $ionicModal.fromTemplateUrl('main/shift/shiftOptions.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.shiftOptionsModal = modal;
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.closeShiftOptionsModal = function () {
        $scope.shiftOptionsModal.hide();
      };

      $scope.$on('$ionicView.beforeEnter', function (event, data) {
        initBill();
        loadLayout();
        loadFunctions();
        $scope.user = AuthService.currentUser();
      });

      $scope.$on('$ionicView.afterEnter', function (event, data) {
        if ($scope.keyboard.pages) {
          $scope.changePage(_.first($scope.keyboard.pages), 0);
          var scroll = $ionicScrollDelegate.$getByHandle('pages-scroll');
          if (scroll) {
            $timeout(function () {
              scroll.scrollTo(0, 0, true);
            }, 300);
          }
        }
      });


      $scope.$on('$ionicView.loaded', function (event, data) {
        init();
      });


      $rootScope.$on('initBill', function (event, data) {
        initBill();
      });

      var initBill = function () {
        $scope.data.barcodeMode = false;
        BillService.getTempHeader(BillService.getCurrentReceiptId()).then(function (header) {
          if (!header) {
            return BillService.initHeader().then(function (header) {
              $scope.header = header;
            });
          } else {
            $scope.header = header;
          }
          $scope.cart.selectedItem = null;
          $scope.TakeAway = false;
          _.each(buttonClicked, function (item, key) {
            buttonClicked[key] = false;
          });
        }).then(function () {
          refresh().then(function () {
            $scope.selectItemWithLineNumber();
          });
        });
      };

      $scope.scrollTo = function (lineNumber) {
        // var currentPos = $ionicScrollDelegate.$getByHandle('cart').getScrollPosition();
        // console.log(currentPos);
        var ele = document.getElementById(lineNumber);
        if (ele) {
          var top = ele.getBoundingClientRect().top;
          if (top) {
            //console.log("lineNumber :"+lineNumber);
            //$ionicScrollDelegate.$getByHandle('cart').scrollTo(0, (top - 83), true);
           /* if(lineNumber<=1500)
             $ionicScrollDelegate.$getByHandle('cart').scrollTo(0, (top - 83), true);
            else*/

            $ionicScrollDelegate.$getByHandle('cart').scrollTo(0, ( ((lineNumber / 100) * 30) - 30), true);

          } else {
            $ionicScrollDelegate.$getByHandle('cart').scrollBottom();
          }

        } else {
          $ionicScrollDelegate.$getByHandle('cart').scrollBottom();
        }


      };

      /**
       * Saves the Business Date set by the user
       * @param date
       */
      var setBusinessDate = function (date) {
        if (moment(date).isValid()) {
          ControlService.setBusinessDate(moment(date));
        } else {
          $log.log('date is not valid');
        }

      };

      var init = function () {
        $scope.shift = ShiftService.getCurrent();
        var ready = true;

        // handle event
        loadLayout();
        loadFunctions();
        refresh().then(function () {
          $scope.selectItemWithLineNumber();
        });
      };
      /**
       * Opens the Business Date picker
       */
      $scope.openDatePicker = function () {
        var datePickerOptions = {
          callback: function (val) {
            setBusinessDate(new Date(val));
          },
          inputDate: ControlService.getNextBusinessDate().isValid() ? ControlService.getNextBusinessDate().toDate() : new Date(),
          setLabel: 'Set Bu. Date',
          showTodayButton: true
        };

        ionicDatePicker.openDatePicker(datePickerOptions);
      };

      $scope.$on('shift-changed', function (event, data) {
        console.log('shift-changed from sales');
        refresh();
      });

      var refresh = function () {
        // nu = false;
        var rec_id = BillService.getCurrentReceiptId();
        return BillService.getTempHeader(rec_id).then(function (header) {
          var promise;
          $scope.navMenuCtrl();
          if (!header) {
            BillService.voidOldBill();
            return BillService.initHeader().then(function (header) {
              // console.log(header);
              $scope.refreshCart();
              $scope.header = header;
              return true;
            }, function (ex) {
              console.log(ex);
            });
          } else {
            $scope.header = header;
            return true;
          }
        }, function (ex) {
          console.log(ex);
        });
      };

      /**
       * Fetches the function list and is devided into top section and bottom
       */
      var loadFunctions = function () {
        FunctionsService.getSalesFunctions().then(function (fns) {
          $scope.functions = fns;
        });
      };

      //to create a range like [0, 1, 2, ..] for buttons
      $scope.range = [];

      /**
       * Initiating Sub PLU modal dialog
       */
      $ionicModal.fromTemplateUrl('subPLU.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        submitted = false;
        $scope.subPLUModal = modal;
      });

      /**
       * Manages the sub PLU modal close event
       */
      $scope.closeSubPLUModal = function () {
        $scope.subPLUModal.hide();
      };

      /**
       * Initiating discount modal dialog
       */
      $ionicModal.fromTemplateUrl('main/discount/discount.html', {
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
       * Initiating reason modal dialog
       */
      $ionicModal.fromTemplateUrl('main/refunds/refundModal.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.refundModal = modal;

      }, function (err) {
        console.log(err);
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('refundModal-close', function () {
        $scope.refundModal.hide();
        $scope.refreshCart();
      });


      /**
       * Initiating shift modal dialog
       */
      $ionicModal.fromTemplateUrl('main/salesKits/salesKit.html', {
        id: 1,
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modals.salesKit = modal;
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('skModalModal-close', function () {
        $scope.showskModalModal = false;
        $scope.qty.value = 1;
        $scope.modals.salesKit.hide();
        $scope.navMenuCtrl();
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('skModalModal-save', function () {
        $scope.showskModalModal = false;
        $scope.salesKitUpdate = false;
        $scope.qty.value = 1;
        $scope.modals.salesKit.hide();
        $scope.navMenuCtrl();
      });

      /**
       * Initiating PWP modal dialog
       */


      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('pwpModal-close', function (modal, pwpitem) {
        // console.log('close');
        if (pwpitem != null || undefined) {
          $scope.cart.selectedItem = pwpitem;
        }
        // selectLastItem();
        console.log($scope.cart.selectedItem);
        // $scope.cart.selectedItem = pwpitem;
        $scope.showpwpModal = false;
        $scope.qty.value = 1;
        $scope.pwpModal.remove();
        $scope.navMenuCtrl();
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('pwpModal-save', function (modal, pwpitem) {
        // console.log('save');
        // console.log(pwpitem);
        $scope.cart.selectedItem = pwpitem;
        $scope.showpwpModal = false;
        $scope.qty.value = 1;
        $scope.pwpModal.remove();
        $scope.navMenuCtrl();
      });

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

      var ShowQtyBox = false;
      $scope.ShowQtyBox = function () {
        if (!ShowQtyBox) {
          $scope.data.barcodeMode = false;
          ShowQtyBox = true;
          $scope.qty.nvalue = 0;
          $scope.qty.uvalue = 0;
          return $ionicPopup.show({
            template: [
              '<style>.popup-container.popup-showing{top: 0%;}</style>' +
              '<input type="number" id="QtyBox" ng-value="qty.nvalue||qty.uvalue" readonly>' +
              '<div class="row" style="padding: 5px 0px 0px; background-color: E9E9E9">' +
              '<div class="numpad">' +
                '<div class="button1-row1" style= "padding: 5px 0px 0px;">' +
                  '<a href="" ng-click="numpadClick(\'7\')" class="button">7</a>' +
                  '<a href="" ng-click="numpadClick(\'8\')" class="button">8</a>' +
                  '<a href="" ng-click="numpadClick(\'9\')" class="button">9</a>' +
                  '&nbsp;&nbsp;&nbsp;' +
                  '<a href="" ng-click="numpadPlus()" class="button">+</a>' +
                '</div>' +
                '<div class="button1-row1">' +
                  '<a href="" ng-click="numpadClick(\'4\')" class="button">4</a>' +
                  '<a href="" ng-click="numpadClick(\'5\')" class="button">5</a>' +
                  '<a href="" ng-click="numpadClick(\'6\')" class="button">6</a>' +
                  '&nbsp;&nbsp;&nbsp;' +
                  '<a href="" ng-click="numpadMinus()" class="button">-</a>' +
                '</div>' +
                '<div class="button1-row1">' +
                  '<a href="" ng-click="numpadClick(\'1\')" class="button">1</a>' +
                  '<a href="" ng-click="numpadClick(\'2\')" class="button">2</a>' +
                  '<a href="" ng-click="numpadClick(\'3\')" class="button">3</a>' +
                  '&nbsp;&nbsp;&nbsp;' +
                  '<a href="" ng-click="numpadDelete()" class="button">Del</a>' +
                '</div>' +
                '<div class="button1-row1">' +
                  '<a href="" ng-click="numpadClick(\'00\')" class="button">00</a>' +
                  '<a href="" ng-click="numpadClick(\'0\')" class="button">0</a>' +
                  '<a href="" ng-click="numpadDotClick()" class="button"> </a>' +
                  '&nbsp;&nbsp;&nbsp;' +
                  '<a href="" ng-click="numpadClear()" class="button">C</a>' +
                '</div>' +
              '</div>' +
              '</div>'
            ],
            title: 'Set Qty',
            subTitle: '',
            scope: $scope,
            buttons: [
              {
                text: 'Cancel',
                onTap: function (e) {
                  $scope.numpadClear();
                }
              },
              {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function (e) {
                  var qty = parseInt($scope.qty.nvalue || $scope.qty.uvalue);
                  $scope.qty.uvalue = 0;
                  numpadValue = '';
                  if (!qty || _.isNaN(qty)) {
                    //don't allow the user to close unless he enters wifi password
                    $scope.qty.value = 1;
                    // e.preventDefault();
                  } else if (qty == 0) {
                    e.preventDefault();
                  }  else {
                    $scope.qty.value = qty;
                  }
                }
              }
            ]
          }).finally(function (res) {
            ShowQtyBox = false;
            $scope.qty.nvalue = 0;
            $scope.qty.uvalue = 0;
            temp = 0;
            return res;
          });
        } else {
          return $q.reject('already open');
        }
      };


      // var dotClicked = false;
      var last = null;
      var first = null;
      /**
       * Handles the number-pad click events
       * @param value
       */
      $scope.numpadPlus = function () {
        if ($scope.qty.uvalue != '' || numpadValue != '' || temp != '') {
          $scope.qty.uvalue = parseInt($scope.qty.uvalue) + 1;
          numpadValue = parseInt(numpadValue) + 1;
          temp = String(parseInt(temp) + 1);
        } else {
          $scope.qty.uvalue = 1;
          numpadValue = 1;
          temp = 1;
        }
      };

      $scope.numpadMinus = function () {
        if (numpadValue < 1 || temp < 1 || $scope.qty.uvalue < 1) {
          $scope.qty.uvalue = 0;
          numpadValue = 0;
          temp = 0;
        } else {
          $scope.qty.uvalue -= 1;
          numpadValue -= 1;
          temp = String(temp - 1);
        }
      };

      $scope.numpadClick = function (value) {
        numpadValue += value;
        temp = numpadValue;
        if (!$scope.qty.uvalue) {
          $scope.qty.uvalue = $scope.qty.nvalue;
        }

        // if (dotClicked) {
        //   var index = $scope.qty.uvalue.indexOf('.');
        //   var tail = $scope.tenderHeader.UpdatedTenderTotal.substr(index + 1, $scope.tenderHeader.UpdatedTenderTotal.length - index);
        //   if (parseFloat(tail.substr(1, 1)) >= 1) {
        //     return;
        //   }
        //   if (tail == '00') {
        //     $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.UpdatedTenderTotal.substr(0, $scope.tenderHeader.UpdatedTenderTotal.indexOf('.') + 1) + value + '0';
        //   } else {
        //     $scope.tenderHeader.UpdatedTenderTotal = $scope.tenderHeader.UpdatedTenderTotal.substr(0, $scope.tenderHeader.UpdatedTenderTotal.indexOf('.') + 2) + value;
        //   }
        //   return;
        // }

        if (temp.length == 1) {
          $scope.qty.uvalue = temp;
        // } else if (temp.length == 2) {
        //   $scope.qty.uvalue= temp = '0.' + temp;
        } else if (temp.length >= 2) {
          last = temp.substr(temp.length - 1, 1);
          first = String(parseInt(temp.substr(0, temp.length - 1)) / 1);
          // console.log('last 1 : ' + last);
          // console.log('first 1 : ' + first);
          if ( first == 0 || first == 00) {
            numpadValue = last;
            temp = last;
            $scope.qty.uvalue = last;
          } else {
            $scope.qty.uvalue = first + last;
            numpadValue = first + last;
            temp = first + last;
          }
        }
        // numpadValue = '';
        setValueManually = true;
      };

      // $scope.numpadDotClick = function () {
      //   if (!$scope.qty.uvalue) {
      //     $scope.qty.uvalue = $scope.qty.nvalue;
      //   }
      //   if (!dotClicked && numpadValue != '') {
      //     numpadValue = parseInt(numpadValue || 0) + '.00';
      //     $scope.tenderHeader.UpdatedTenderTotal = numpadValue;
      //     dotClicked = true;
      //   }
      // };

      /**
       * Clears the number-pad input
       */
      $scope.numpadClear = function () {
        if (setValueManually) {
          $scope.qty.uvalue = 0;
          numpadValue = '';
          // dotClicked = false;
          setValueManually = false;
        }
      };

      /**
       * Delete last the number-pad input
       */
      $scope.numpadDelete = function () {
        if (temp.length == 1) {
          $scope.qty.uvalue = 0;
          numpadValue = '';
          temp = 0;
        } else if (temp.length >= 2){
          var del = temp.substr(0, temp.length - 1);
          $scope.qty.uvalue = del;
          numpadValue = del;
          temp = del;
        } else {
          $scope.numpadClear();
        }
      };
      /**
       * Loads the layout for sales keys & pages
       * @returns {*|Promise.<TResult>}
       */
      var loadLayout = function () {
          return KeyBoardService.getLayout().then(function (layout) {
            $scope.layout = layout;
            if (layout) {
              loadPages(layout.LayoutId);
            }
            return layout;
          });
        },

        loadPages = function (layoutId) {
          return KeyBoardService.getPages(layoutId).then(function (pages) {
            $scope.keyboard.pages = pages;
            loadKeys(layoutId);
            return $scope.keyboard.activePage;
          });
        },
        loadKeys = function (layoutId) {
          return KeyBoardService.getKeys(layoutId).then(function (keys) {
            $scope.keyboard.keys = keys;
            $scope.changePage(_.first($scope.keyboard.pages), 1);
            // var keyCount = $scope.pages.length * 32;
            // var keySet = {};
            // for (var i in _.range(1, keyCount + 1)) {
            //   keySet[i] = _.findWhere(keys, {KeyNo: parseInt(i)});
            // }
            // $scope.key = keySet[1];
            // $scope.keys = keySet;
            // $scope.range = _.range(1, 33);
            return keys;
          });
        };
      // loadLayout();

      var errHandler = function (err) {
        console.log(err.message);
      };

      var getActiveKeys = function (pageId) {
        var keys = {};
        var keyObj = {};
        if ($scope.keyboard.keys[pageId]) {
          keys = $scope.keyboard.keys[pageId];
          // console.log(keys);
        }

        for (var i = 1; i <= 31; i++) {
          keyObj[i] = keys[i] ? keys[i] : {};
        }
        keyObj[32] = keys[0] ? keys[0] : {};
        // console.log(keyObj);
        return keyObj;
      };

      /**
       * Refreshes the keyboard layout after sync
       */
      $scope.$on('sync', function () {
        loadLayout().then(function () {
        }, errHandler);
      });

      /**
       * Fetches the key according to the button slot
       * @param keyNo
       */
      $scope.getKey = function (keyNo) {
        return _.findWhere($scope.keys, {KeyNo: keyNo});
      };


      /**
       * Manages the change page event
       * @param page
       * @param $index
       */
      $scope.changePage = function (page, $index) {
        $scope.data.barcodeMode = false;
        if (page) {
          $scope.keyboard.pages = _.map($scope.keyboard.pages, function (p, key) {
            p.selected = false;
            return p;
          });
          $scope.keyboard.activePage = page;
          page.selected = true;
          // $scope.range = _.range((32 * $index) + 1, (32 * $index) + 33);
          // console.log(page);
          if ($scope.keyboard.activePage) {
            $scope.keyboard.activeKeys = getActiveKeys($scope.keyboard.activePage.Id);
          }
        }

      };

      /**
       * Manages the sales item click event
       * @param item
       */
      
      $scope.bkey = false;
      var priceFormShown = false;
      $scope.onKeyClick = function (item) {
        // console.time("test");
        $scope.$emit('BlockMenu', false);
        console.log($scope.bkey);
        $scope.bkey = true;
        console.log($scope.bkey);
        // Alert.showLoading();
        $scope.data.barcodeMode = false;
        if (item) {
          if (item.Type == 'P') {
            $scope.keyboard.activeKeys = getActiveKeys(item.SubPage);
            return false;
          }

          $scope.selectedItem = angular.copy(item);
          if (item.SubPLU1Code == '') {
            $scope.SubPLUList = [];
            SubPLU1Service.getAvailable(item.PLU).then(function (data) {
              $scope.SubPLUList = data;
              $scope.modalData = {title: 'SubPLU 1 ' + item.PLU, subPLU: 1};
              submitted = false;
              $scope.subPLUModal.show();
            });
          } else if (item.SubPLU2Code == '') {
            $scope.SubPLUList = [];
            SubPLU2Service.getAvailable(item.PLU).then(function (data) {
              $scope.SubPLUList = data;
              $scope.modalData = {title: 'SubPLU 2 ' + item.PLU, subPLU: 2};
              submitted = false;
              $scope.subPLUModal.show();
            });
          } else if (item.SubPLU3Code == '') {
            $scope.SubPLUList = [];
            ItemService.getAvailable(item.PLU).then(function (data) {
              $scope.SubPLUList = data;
              $scope.modalData = {title: 'SubPLU 3 ' + item.PLU, subPLU: 3};
              submitted = false;
              $scope.subPLUModal.show();
            });
          }
          fetchSelectedItem($scope.selectedItem);
          // $timeout(function () { Alert.hideLoading();}, 20);
          $timeout(function () { $scope.bkey = false;}, 200); // in case of increase the waiting time
          
        }
      };

      var showPriceForm = function () {
        var wasBCMOn = $scope.data.barcodeMode == true;
        if (!priceFormShown) {
          $scope.data.barcodeMode = false;
          priceFormShown = true;
          $scope.data.amount = '';
          return $ionicPopup.show({
            template: '<input type="tel" id="priceTextBox" ng-model="data.amount" autofocus="autofocus">',
            title: 'Enter Amount',
            subTitle: '',
            scope: $scope,
            buttons: [
              {text: 'Cancel'},
              {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function (e) {
                  if (!$scope.data.amount || _.isNaN($scope.data.amount) || $scope.data.amount == 0) {
                    //don't allow the user to close unless he enters wifi password
                    e.preventDefault();
                  } else {
                    return $scope.data.amount;
                  }
                }
              }
            ]
          }).finally(function (res) {
            priceFormShown = false;
            if (wasBCMOn) {
              $scope.data.barcodeMode = true;
              $scope.onBarcodeTextBlur();
            }
            return res;
          });
        } else {
          return $q.reject('already open');
        }
      };

      var selectItem = function (item) {
        if ($scope.qty.value == '') {
          $scope.qty.value = 1;
        }
        SalesKitService.getSalesKit(item.Id, businessDate).then(function (salesKit) {
          console.log(salesKit);
          if (salesKit && !salesKit.isEmpty) {
            if ($scope.showskModalModal == false) {
              $scope.showskModalModal = true;
              $timeout(function () {
                $scope.modals.salesKit.data = {
                  salesKit: salesKit,
                  update: false
                };
                if (Object.keys(salesKit.component).length != 0) {
                  $scope.modals.salesKit.show();
                } else {
                  $scope.$broadcast('save', salesKit);
                }
              }, 200);
            }
          } else {
            return ItemService.getPrice(item.Plu, parseInt(item.PriceGroupId)).then(function (data) {
              if (data) {
                var q = null;
                if (data.Price == 0 && item.ZeroPrice == 'false') {
                  q = showPriceForm().then(function (amount) {
                    if (amount && amount > 0) {
                      amount = parseFloat(amount);
                      item.Price = amount || 0;
                      item.OrgPrice = amount || 0;
                      item.AlteredPrice = amount || 0;
                      item.StdCost = 0;
                      item.PriceLevelId = 0;
                      item.OpenKey = true;
                      return item;
                    } else {
                      return $q.reject();
                    }

                  });

                } else {
                  q = $q.when(data, function () {
                    item.Price = data ? data.Price : 0;
                    item.OrgPrice = data ? data.OrgPrice : 0;
                    item.AlteredPrice = data ? data.AlteredPrice : 0;
                    item.StdCost = data ? data.StdCost : 0;
                    item.PriceLevelId = data ? data.PriceLevelId : 0;
                    return item;
                  });
                }

              } else {
                q = showPriceForm().then(function (amount) {
                  amount = parseFloat(amount);
                  item.Price = amount || 0;
                  item.OrgPrice = amount || 0;
                  item.AlteredPrice = amount || 0;
                  item.StdCost = 0;
                  item.PriceLevelId = 0;
                  return item;
                });
              }

              q.then(function (item) {
                item.ItemId = item.Id;
                item.ItemType = 'NOR';
                var customeQty = $scope.qty.value;
                if (customeQty > 1) {
                  item.customQuantity = customeQty;
                }
                if ($scope.TakeAway) {
                  item.TakeAway = true;
                }
                PWPService.getPWP(item, item.customQuantity || item.Qty).then(function (pwp) {
                  if (item.Qty == undefined) {
                    item.Qty = 0;
                    if (item.customQuantity == undefined) {
                      item.customQuantity = 1;
                    }
                  }
                  if (pwp && ( (item.Qty >= pwp.Quantity) || item.customQuantity >= pwp.Quantity) && pwp != true) {
                    if ($scope.showpwpModal == false) {
                      $scope.showpwpModal = true;
                      $scope.pwp = pwp;
                      $scope.shownModal = 'pwp';
                      $ionicModal.fromTemplateUrl('main/pwp/pwp.html', {
                        scope: $scope,
                        backdropClickToClose: false,
                        animation: 'slide-in-up'
                      }).then(function (modal) {
                        $scope.pwpModal = modal;
                        $scope.pwpModal.show();
                      });
                    }
                  } else if (pwp == true) {   
                    $scope.$emit('BlockMenu', true);
                  } else {
                    CartItemService.addItemToCart($scope.header.DocNo, item).then(function (it) {
                      $scope.refreshCart().then(function () {
                        //$scope.scrollTo(it.LineNumber);
                        $scope.qty.value = 1;
                        $scope.selectItemWithLineNumber(it.LineNumber);
                        $scope.PostApi(it);
                      });
                    }, function (ex) {
                      console.log(ex);
                    });
                  }
                }, function (err) {
                  console.log(err);
                });
              });

            }, function (err) {
              Alert.error(err.message);
            });
          }

        }, function (err) {
          console.log(err);
        });
      };

      /**
       * Support function to fetch the selected item details
       * @param selectedItem
       */
      var fetchSelectedItem = function (selectedItem) {
        if (selectedItem.SubPLU1Code != '' && selectedItem.SubPLU2Code != '' && selectedItem.SubPLU3Code != '') {
          ItemService.get(selectedItem.PLU, selectedItem.SubPLU1Code, selectedItem.SubPLU2Code, selectedItem.SubPLU3Code).then(function (item) {
            selectItem(item);
          }, function (err) {
            console.log(err.message);
            $scope.refreshCart();
          });
        }
      };

      /**
       * Manages the cart item click event
       * @param item
       */
      $scope.selectItem = function (item) {
        // if(!$scope.cart.selectedItem || !item || item.LineNumber != $scope.cart.selectedItem.LineNumber){

        // }
        if (item) {

          $scope.cart.items = _.map($scope.cart.items, function (item) {
            item.selected = false;
            return item;
          });
          item.selected = true;

        }
        $scope.cart.selectedItem = item;
      };

      /**
       * Manages the cart item click event inside sub PLU modal
       * @param item
       */
      $scope.onSubPLUClick = function (subPLU) {
        if (submitted == false)
        {
          submitted = true;
          $scope.selectedItem['SubPLU' + $scope.modalData.subPLU + 'Code'] = subPLU.Code;
          $scope.selectedItem['SubPLU' + $scope.modalData.subPLU + 'Id'] = subPLU.Id;
          $scope.subPLUModal.hide();
          fetchSelectedItem($scope.selectedItem);
        }
      };

      /**
       * Manages the open tender modal event
       * @param item
       */

      $scope.openTenderForm = function () {
        if (!_.isEmpty($scope.cart.items)) {
          $state.go('app.tender', {DocNo: $scope.header.DocNo});
        }
      };
      var updatenewitem = 0 ;
      /**
       * Secondary display Post
       */
      $scope.PostApi = function (it, type) {
        // console.log('it');console.log(it);
        // console.log('type');console.log(type);
        // console.log('$scope.cart.items');console.log($scope.cart.items);
        var DitemArray = new Array;;
        angular.forEach($scope.cart.items, function(Ditem) {
          if (it.update == 1) {
            if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
              $scope.PutFunction(Ditem);
            } 
          } else {
            if(type == 1) { // SaleKit 
              if ((it[0].ItemType == Ditem.ItemType) && (it[0].ItemId == Ditem.ItemId) && (it[0].LineNumber == Ditem.LineNumber)) {
                $scope.PostFunction(Ditem);
              }
              angular.forEach(it[0].selectedList, function(Citem) {
                if ((Citem.ItemType == Ditem.ItemType) && (Citem.ItemId == Ditem.ItemId) && (Citem.LineNumber == Ditem.LineNumber)) {
                  $scope.PostFunction(Ditem);
                } 
              })
            } else if (type == 2) { // PWP & F/B Modifier
              angular.forEach(it, function(Citem) {
                if ((Citem.ItemType == Ditem.ItemType) && (Citem.ItemId == Ditem.ItemId) && (Citem.LineNumber == Ditem.LineNumber)) {
                  $scope.PostFunction(Ditem);
                } 
              })
            } else if (type == 3) { // SKI non-void
              console.log(it);
            } else if (type == 4) { // SKI update
              if (updatenewitem == 0) {
                if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
                  updatenewitem ++;
                  $scope.PutFunction(Ditem, 1);
                } 
              } else if (control == updatenewitem) {
                updatenewitem = 0;
              } else {
                if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
                  updatenewitem ++;
                  $scope.PostFunction(Ditem, 1);
                } 
              }
            // } else if (type == 5) { // F/B Modifier
            //   angular.forEach(it, function(Citem) {
            //     if ((Citem.ItemType == Ditem.ItemType) && (Citem.ItemId == Ditem.ItemId) && (Citem.LineNumber == Ditem.LineNumber)) {
            //       $scope.PostFunction(Citem);
            //     } 
            //   })
            } else {
              if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
                $scope.PostFunction(Ditem);
              } 
            }
          }
        });
      };

      $scope.PostFunction = function (Nitem, del) {
        // console.log(del);
        // console.log(Nitem);
        // console.log(TempDeleteItem);
        $http({
          method: 'POST',
          url: requestUrl,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            "itemDescription": Nitem.Desc1,
            "itemQuantity": Nitem.Qty,
            "itemTotal": Nitem.Total,
            "itemDiscount": Nitem.Discount + Nitem.Tax5DiscAmount || Nitem.DiscAmount + Nitem.Tax5DiscAmount ,
            "itemOrgPrice": Nitem.OrgPrice,
            "itemOrderedDateTime": moment(Nitem.OrderedDateTime).format("YYYY-MM-DDTHH:mm:ss.sssZ"),
            "machineId": Nitem.MachineId,
            "locationId": Nitem.LocationId,
            "docNo": Nitem.DocNo,
            "itemType": Nitem.ItemType,
            "itemId" : Math.floor(Nitem.ItemId),
            "lineNumber" : Nitem.LineNumber,
            "parentItemLineNumber" : Nitem.ParentItemLineNumber
          }
        }).then(function successCallback(response) {
          console.log('Post');
        }, function errorCallback(response) {
          console.log(response);
        });
      }

      $scope.PutFunction = function (Nitem, upf) {
        // console.log('put');  
        if (TempDeleteItem != null && upf == 1) {
          PrevItemId = Math.floor(TempDeleteItem.ItemId);
          TempDeleteItem = null;
        } else {
          PrevItemId = Math.floor(Nitem.ItemId);
        }
        $http({
          method: 'PUT',
          url: requestUrl,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            "itemDescription": Nitem.Desc1,
            "itemQuantity": Nitem.Qty,
            "itemTotal": Nitem.Total,
            "itemDiscount": Nitem.Discount + Nitem.Tax5DiscAmount || Nitem.DiscAmount + Nitem.Tax5DiscAmount,
            "itemOrgPrice": Nitem.OrgPrice,
            "itemOrderedDateTime": moment(Nitem.OrderedDateTime).format("YYYY-MM-DDTHH:mm:ss.sssZ"),
            "machineId": Nitem.MachineId,
            "locationId": Nitem.LocationId,
            "docNo": Nitem.DocNo,
            "itemType": Nitem.ItemType,
            "itemId" : Math.floor(Nitem.ItemId),
            "previousItemId" : PrevItemId,
            "lineNumber" : Nitem.LineNumber,
            "parentItemLineNumber" : Nitem.ParentItemLineNumber
          }
        }).then(function successCallback(response) {
          console.log('Update');
        }, function errorCallback(response) {
          console.log(response);
        });
      }


      /**
       * Secondary display Delete
       */
      var delpwp = 0;
      $scope.DeleteApi = function (item) {
        // console.log(item);
        if (item) {
          if (item.ItemType == "SKT" ) { // SaleKit
            angular.forEach($scope.cart.items, function(Ditem) {
              if (Ditem.ParentItemLineNumber == item.LineNumber) {
                $scope.DeleteFunction(Ditem);
              }
            });
            $scope.DeleteFunction(item);
          } else if (item.ItemType == 'PWP') { 
            $scope.DeleteFunction(item);
            delpwp = 1;
            if (delpwp == 1) {
              angular.forEach($scope.cart.items, function(Ditem) {
                if (Ditem.ParentItemLineNumber == item.LineNumber) {
                  $scope.DeleteFunction(Ditem);
                }
              });
            }
            delpwp = 0;
          } else if (item.ItemType == 'SKI') { 
            console.log('Not Delete');
          } else {
            $scope.DeleteFunction(item);
          }
        } else {
          $scope.DeleteAllFunction();
          // angular.forEach($scope.cart.items, function(Ditem) {
          //   $scope.DeleteFunction(Ditem);
          // });
        }
      };

      $scope.DeleteAllFunction = function () {
        var MachineId = SettingsService.getMachineId();
        $http({
          method: 'DELETE',
          url: requestUrl + '/' + MachineId,
          headers: {
            'Content-Type': 'application/json'
          },
        }).then(function successCallback(response) {
        console.log('Delete');
        }, function errorCallback(response) {
          console.log(response);
        });
      }

      $scope.DeleteFunction = function (Ditem) {
        $http({
          method: 'DELETE',
          url: requestUrl,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            "itemDescription": Ditem.Desc1,
            "itemQuantity": Ditem.Qty,
            "itemTotal": Ditem.Total,
            "itemDiscount": Ditem.Discount + Ditem.Tax5DiscAmount,
            "itemOrgPrice": Ditem.OrgPrice,
            "itemOrderedDateTime": moment(Ditem.OrderedDateTime).format("YYYY-MM-DDTHH:mm:ss.sssZ"),
            "machineId": Ditem.MachineId,
            "locationId": Ditem.LocationId,
            "docNo": Ditem.DocNo,
            "itemType": Ditem.ItemType,
            "itemId" : Math.floor(Ditem.ItemId),
            "lineNumber" : Ditem.LineNumber,
            "parentItemLineNumber" : Ditem.ParentItemLineNumber
          }
        }).then(function successCallback(response) {
        console.log('Delete');
        }, function errorCallback(response) {
          console.log(response);
        });
      }

      /**
       * Refreshes the cart data from it's service
       */
      $scope.refreshCart = function (susp) {
        // console.log('susp : ' + susp);
        return CartItemService.fetchItemsFromDb().then(function (items) {
          $scope.cart.items = items;
          // console.log($scope.cart.items);
          
          angular.forEach($scope.cart.items, function(Ditem) {
            // console.log('Ditem');console.log(Ditem);
            if (susp == 1) {
              $scope.PostFunction(Ditem);
            } else {
              $scope.PutFunction(Ditem);
            }
          });
          
  
          $scope.cart.isEmpty = _.isEmpty(items);
          $scope.cart.summery = CartItemService.getSummery();
          $scope.navMenuCtrl();
          if (!$scope.cart.isEmpty) {
            angular.forEach($scope.cart.items, function (item, key) {
              if ($scope.cart.selectedItem && $scope.cart.selectedItem.ItemId == item.ItemId && $scope.cart.selectedItem.LineNumber == item.LineNumber) {
                $scope.cart.items[key] = item;
              }
              if (item.TakeAway == 'false') {
                $scope.TakeAway = false;
              }
              if ($scope.cart.selectedItem && $scope.cart.selectedItem.LineNumber == item.LineNumber) {
                $scope.selectItemWithLineNumber(item.LineNumber);
              }
            });
          } else {
            $scope.cart.selectedItem = null;
          }


          // $ionicScrollDelegate.$getByHandle('cart').scrollBottom(true);
        });

      };
      $scope.refreshCart();

      $rootScope.$on('refresh-cart', function (event, tendered) {
        if (tendered == true) {
          $scope.DeleteApi();
        }
        $scope.refreshCart();
      });

      $scope.$on('refresh-cart', function () {
        $scope.refreshCart();
      });

      $scope.$on('refresh-susp-cart', function () {
        var susp = 1;
        $scope.refreshCart(susp);
      });
      /**
       * Invokes the given named function from $scope.salesFunctions
       * @param name
       */
      $scope.invoke = function (fn) {
        if (!_.isUndefined($scope.salesFunctions[fn.Name])) {
          $scope.data.barcodeMode = false;
          // if(authorityCheck(fn)) {

          if ((fn.Transact == 'true' && _.isEmpty($scope.cart.items))) {
            Alert.warning('Action not allowed');
          } else {
            $scope.salesFunctions[fn.Name](fn);
          }

          // }
        } else {
          throw new Error('Function ' + fn.Name + ' is not available.');
        }
      };

      $scope.selectItemWithLineNumber = function (lineNumber) {
        if ($scope.cart.items) {
          var key = null;
          angular.forEach($scope.cart.items, function (item, k) {
            if (item.LineNumber == lineNumber) {
              key = k;
              return;
            }
          });
          //console.log('key :'+key);
          if (key || key == 0) {
            /*
            if (!$scope.cart.selectedItem || $scope.cart.selectedItem.LineNumber != lineNumber) {
             $scope.scrollTo(lineNumber);
            } else {
               //$scope.scrollTo(lineNumber);
              console.log('same');
            }*/
            $scope.scrollTo(lineNumber);
            $scope.selectItem($scope.cart.items[key]);
          } else {
            var last = $scope.cart.items[Object.keys($scope.cart.items)[Object.keys($scope.cart.items).length - 1]];
            if (last) {
              $scope.selectItem(last);
              $scope.scrollTo(last.LineNumber);
            } else {
              $scope.selectItem(null);
            }
          }
        }
      };

      $scope.navMenuCtrl = function () {
        $timeout(function () {
          var last = Object.keys($scope.cart.items).length - 1;
          // console.log('last : ' + last);
          if (last >= 0) {
            $scope.$emit('BlockMenu', false);
          } else {
            $scope.$emit('BlockMenu', true);
          }
        }, 200);
      }
      /**
       * Contains the list of functions for sales
       * @type {{VoidTop: $scope.salesFunctions.VoidTop}}
       */
      $scope.flag = false;
      $scope.salesFunctions = {
        VoidTop: function (fn) {
          Suspended = false;
          // $scope.flag = true;
          Alert.showLoading();
          var item = $scope.cart.selectedItem;
          var last = Object.keys($scope.cart.items).length - 1;
          if (last == 0) {
            $scope.DeleteApi();
          } 
          if (item) { 
            if (item.ItemType == 'PWI') {
                if (item.SuspendDepDocNo != '' && item.SuspendDepDocNo != null) {
                  Alert.warning('Item Void not allowed.', 'ItouchLite');
                } else {        
                  Alert.warning('Item Void not allowed.', 'ItouchLite');// TO DO : ADD reslect option for pwp child
                  // console.log('fck me');
                  // BillService.voidSalesKit(item).then(function () {
                  //   $scope.refreshCart().then(function () {
                  //     $scope.selectItemWithLineNumber();
                  //   });
                  //   $scope.navMenuCtrl();
                  // }, function (err) {
                  //   console.log(err);
                  // });
                }
                $timeout(function () { Alert.hideLoading();}, 20);
              return;
            } else if (item.ItemType == 'SKT') {
              if (item.SuspendDepDocNo != '' && item.SuspendDepDocNo != null) {
                Alert.warning('Item Void not allowed.', 'ItouchLite');
              } else {     
                $scope.DeleteApi(item);   
                BillService.voidSalesKit(item).then(function () {
                  $scope.refreshCart().then(function () {
                    $scope.selectItemWithLineNumber();
                  });
                  $scope.navMenuCtrl();
                }, function (err) {
                  console.log(err);
                });
              }
            }
            // else if(item.ItemType == 'PWP'){
            //   var promises = [BillService.voidItem(item)];
            //   CartItemService.getChildItems(item.LineNumber).then(function(data){
            //     angular.forEach(data, function(childItem){
            //       if(childItem){
            //         promises.push(BillService.voidItem(childItem));
            //       }
            //     });
            //     $q.all(promises).then(function(){
            //       $scope.refreshCart().then(function () {
            //         // console.log('void');
            //         $scope.selectItemWithLineNumber();
            //       });
            //     }, function(err){
            //       console.log(err);
            //     });
            //   });
            // }
            else {

              if (item.ItemType == 'SKI') {
                if (item.Selectable == 'true') {
                  $scope.DeleteApi(item);
                  if ($scope.showskModalModal == false) {
                    $scope.showskModalModal = true;
                    CartItemService.findSalesKitParent(item.ParentItemLineNumber).then(function (parentItem) {
                      console.log(parentItem);
                      SalesKitService.getSalesKit(parentItem.ItemId, businessDate).then(function (salesKit) {
                        console.log(salesKit);
                        if (salesKit) {
                          $timeout(function () {
                            if ($scope.modals.salesKit) {
                              $scope.modals.salesKit.data = {
                                salesKit: salesKit,
                                update: true
                              };
                              TempDeleteItem = item;
                              control = TempDeleteItem.Qty;
                              $scope.modals.salesKit.show();
                            }
                          }, 500);

                        }
                      }, function (ex) {
                        console.log(ex);
                      });
                    });
                  }
                } else {
                  Alert.warning('This item is unchangable', 'ItouchLite');
                }
              } else {
                if (item.SuspendDepDocNo != '' && item.SuspendDepDocNo != null) {
                    //window.alert('Item Void not allowed.');
                  Alert.warning('Item Void not allowed.', 'ItouchLite');
                }
                else {
                  $scope.DeleteApi(item);
                  BillService.voidItem(item).then(function () {
                    $scope.refreshCart().then(function () {
                      $scope.selectItemWithLineNumber();
                    });
                    $scope.navMenuCtrl();
                  }, function (err) {
                    console.log(err);
                  });
                }
              }
            }    
            $timeout(function () { Alert.hideLoading();}, 20);
            $scope.navMenuCtrl();
          } else {
            if (!buttonClicked.voidBill) {
              buttonClicked.voidBill = true;
              if (authorityCheck(fn)) {
                $scope.shownModal = 'voidBill';
                $ionicModal.fromTemplateUrl('main/voidBill/voidBill.html', {
                  id: 5,
                  scope: $scope,
                          //backdropClickToClose: true,
                  backdropClickToClose: false,
                  animation: 'slide-in-up'
                }).then(function (modal) {
                  $scope.modals.voidBillModal = modal;
                  $scope.modals.voidBillModal.show();
                });
              } else {
                buttonClicked.voidBill = false;
              }
            }
            $timeout(function () { Alert.hideLoading();}, 20);
          }
        },
        Discount: function (fn) {
          if (authorityCheck(fn)) {
            /*Yi Yi Po(24/07/2017)*/
            $ionicScrollDelegate.scrollTop();
            /*--*/
            var item = $scope.cart.selectedItem;
            if (item) {
              var condition = true;
              var errors = [];
              if (!item) {
                errors.push('No item selected');
                condition = false;
              } else {
                if (!item) {
                  errors.push('No item selected');
                  condition = false;
                }
                if (item.ItemType != 'NOR' && item.ItemType != 'SKT' && item.ItemType != 'PWP') {
                  errors.push('Not an eligible item type');
                  condition = false;
                }
                else if (!DiscountService.checkItemEligibility(item)) {
                  errors.push('Not an eligible item');
                  condition = false;
                }

                // if (!authorityCheck(fn)) {
                //   errors.push("Not authorized");
                //   condition = false;
                // }
              }


              if (condition) {
                $scope.shownModal = 'itemDiscounts';
                $scope.discountModal.show();
              } else {
                Alert.error(errors.join(' | '));
              }
            }
          }

        },
        QtyPlus: function (fn) {
          // $scope.flag = true;
          Alert.showLoading();
          var item = $scope.cart.selectedItem;
          if (Suspended == true && item.SuspendDepDocNo !== '') {
            Alert.warning('Suspended Order: Action not allowed.');
          } else if (item.SuspendDepDocNo === '') {
            if (item && item.ItemType == 'NOR' && !ItemService.isDiscounted(item) && !ItemService.isRefunded(item)) {
              if (authorityCheck(fn)) {
                var qty = angular.copy(item.Qty);
                BillService.changeItemQty(item.DocNo, item.ItemId, item.LineNumber, ++qty).then(function () {
                  $scope.refreshCart().then(function () {
                    $scope.selectItemWithLineNumber(item.LineNumber);
                  });
                }, function (err) {
                  console.log(err);
                });
              }
            }
          }
          $timeout(function () { Alert.hideLoading();}, 20);
        },
        QtyMinus: function (fn) {
          
          var item = $scope.cart.selectedItem;
          if (Suspended == true && item.SuspendDepDocNo !== '') {
            Alert.warning('Suspended Order: Action not allowed.');
          } else if (item.SuspendDepDocNo === '') {
            // $scope.flag = true;
            Alert.showLoading();
            if (item && item.ItemType == 'NOR' && !ItemService.isDiscounted(item) && !ItemService.isRefunded(item)) {
              if (authorityCheck(fn)) {
                var qty = angular.copy(item.Qty);
                if (qty > 1) {
                  BillService.changeItemQty(item.DocNo, item.ItemId, item.LineNumber, --qty).then(function () {
                    $scope.refreshCart().then(function () {
                      $scope.selectItemWithLineNumber(item.LineNumber);
                    });
                  }, function (err) {
                    console.log(err);
                  });
                } else {
                  Alert.warning('Minimum Quantity: Action not allowed.')
                  // $scope.flag = false;  
                }
              }
            }
            $timeout(function () { Alert.hideLoading();}, 20);
          }
          
        },
        ItemReverse: function (fn) {
          if (authorityCheck(fn)) {
            var item = $scope.cart.selectedItem;
            if (item.SuspendDepDocNo != '') {
              Alert.warning('Item refund not allowed.');
            }
            else {
              if (item && item.ItemType == 'NOR') {
                if (!ItemService.isRefunded(item)) {
                  $scope.refundModal.show();
                }
                else {
                  BillService.toggleRefundItem(item.ItemId, item.LineNumber).then(function () {
                    $scope.refreshCart();
                  });
                }
              }
            }
          }
        },
        CallSuspendBill: function (fn) {
          if (!buttonClicked.recallSuspendBillModal) {
            
            var item = $scope.cart.selectedItem;
            buttonClicked.recallSuspendBillModal = true;
                //if (authorityCheck(fn)) {
            CartItemService.isEmpty($scope.header.DocNo).then(function (empty) {
              if (empty) {
                $scope.flag = true;
                if (authorityCheck(fn)) {
                  Suspended = true;
                  $ionicModal.fromTemplateUrl('main/recallSuspendedBill/recallSuspendedBill.html', {
                    id: 14,
                    scope: $scope,
                                //backdropClickToClose: true,
                    backdropClickToClose: false,
                    animation: 'slide-in-up'
                  }).then(function (modal) {
                    $scope.modals.recallSuspendBillModal = modal;
                    $scope.modals.recallSuspendBillModal.show();
                                //buttonClicked.recallSuspendBillModal = false;
                  });
                }
                else
                          {
                  refresh();
                  buttonClicked.recallSuspendBillModal = false;
                }
                $scope.flag = false;
              } else {
                $scope.flag = true;
                Alert.showLoading();
                SuspendService.suspend($scope.header.DocNo, Suspended, item.SuspendDepDocNo).then(function () {
                  // console.log($scope.header.DocNo);
                  Suspended = true; //GGWP
                  $scope.DeleteApi();
                  refresh();
                }, function (ex) {
                  console.log(ex);
                }).finally(function () {
                  buttonClicked.recallSuspendBillModal = false;
                  Alert.success('Suspend completed');
                  $scope.$emit('BlockMenu', true);
                  Alert.hideLoading();
                  $scope.flag = false;
                });

              }
            });
                //}

          }

        },
        Shiftoption: function (fn) {
          if (_.isEmpty($scope.cart.items)) {
            if (authorityCheck(fn)) {
              $state.go('app.shift');
            }
          }
          else {
            Alert.warning('Cart is not empty.', 'ItouchLite');
          }
        },
        AbortFunction: function (fn) {
          $scope.flag = false;
          if (authorityCheck(fn)) {
            Suspended = false;
            if (_.size($scope.cart.items) > 0) {
              Alert.showConfirm('This will remove all the items', 'Abort?', function (res) {
                if (res == 1) {
                  $scope.flag = true;
                  BillService.getTempHeader($scope.header.DocNo).then(function (header) {
                    // $scope.tenderHeader = header;
                    // console.log($scope.header);
                    return BillService.updateHeaderTotals(header.DocNo).then(function () {
                          //$scope.header.DocType = 'AV';
                          //$scope.header
                      header.DocType = 'AV';
                      $scope.DeleteApi();
                      return BillService.saveBill(header, $scope.cart.items).then(function (res) {
                        Reciept.printAbort($scope.header.DocNo);
                              /*Yi Yi Po*/
                        $scope.billdetail = _.map($scope.cart.items, function (item) {
                          if (item.SuspendDepDocNo) {
                            $scope.header.isSuspended = true;
                            $scope.header.SuspendDocNo = item.SuspendDepDocNo;
                          }
                          $scope.flag = false;
                          return item;
                        });
                        if ($scope.header.isSuspended) {
                          var outletUrl = AppConfig.getOutletServerUrl();
                          if (outletUrl) {
                            Restangular.oneUrl('DeleteSuspendBill', outletUrl + 'DeleteSuspendBill').get({ SuspendDocNo: $scope.header.SuspendDocNo }).then(function (res) {
                              if (res == 'success') {
                                return true;
                              } else {
                                return $q.reject('Invalid service');
                              }
                            });
                          }
                        }
                        /*--*/
                        refresh();
                        initBill();
                      }, function (res) {
                        console.log(res);
                      });
                    });

                  });
                }
              });
            } else {
              Alert.warning('No items in the cart!');
            }
            $scope.flag = false;
          }

        },
        FoodModifier: function (fn) {     
          var item = $scope.cart.selectedItem;
          if (Suspended == true && item.SuspendDepDocNo !== '') {
            Alert.warning('Suspended Order: Action not allowed.');
          } else if (authorityCheck(fn)) {
            if (item && item.ItemType != 'MOD' && item.ItemType != 'SKT') {
              $scope.type = 'F';
              $scope.shownModal = 'mod';
              $scope.modals.modifiers.show();
            }
          }

        },
        BeveragesModifiers: function (fn) {
          var item = $scope.cart.selectedItem;
          if (Suspended == true && item.SuspendDepDocNo !== '') {
            Alert.warning('Suspended Order: Action not allowed.');
          } else if (authorityCheck(fn)) {
            if (item && item.ItemType != 'MOD' && item.ItemType != 'SKT') {
              $scope.type = 'B';
              $scope.shownModal = 'mod';
              $scope.modals.modifiers.show();
            }
          }

        },
        PartialTakeaway: function (fn) {
          if (authorityCheck(fn)) {
            var item = $scope.cart.selectedItem;
            if (item) {
              BillService.setTakeAway(item.TakeAway == 'false' ? true : false, item.ItemId, item.LineNumber).then(function () {
                // console.log("done");
                $scope.refreshCart();
              }, function (ex) {
                console.log(ex);
              });
            }
          }
        },
        FullTakeaway: function (fn) {
          if (authorityCheck(fn)) {
            $scope.TakeAway = !$scope.TakeAway;
            BillService.fullTakeAway($scope.cart.items, $scope.TakeAway).then(function () {
              $scope.refreshCart();
            }, function (ex) {
              console.log(ex);
            });

          }
        },
        ReceiptHistory: function (fn) {
          $scope.flag = true;
          if (authorityCheck(fn)) {
            $state.go('app.history');
          }
          $scope.flag = false;
        },
        ItemDetailTop: function (fn) {
          $scope.flag = true;
          if (authorityCheck(fn)) {
            if ($scope.cart.selectedItem) {
              if ($scope.modals.itemDetails) {
                $scope.shownModal = 'itemDetails';
                $scope.modals.itemDetails.show();
              }
            }
          }
          $scope.flag = false;
        },
        OrderTag: function (fn) {
          $scope.flag = true;
          if (authorityCheck(fn)) {
            $scope.data.tag = '';
            $ionicPopup.show({
              template: '<input type="tel" ng-model="data.tag" autofocus="autofocus">',
              title: 'Order Tag',
              subTitle: '',
              scope: $scope,
              buttons: [
                {text: 'Cancel'},
                {
                  text: '<b>Save</b>',
                  type: 'button-positive',
                  onTap: function (e) {
                    if (!$scope.data.tag) {
                      //don't allow the user to close unless he enters wifi password
                      e.preventDefault();
                    } else {
                      return $scope.data.tag;
                    }
                  }
                }
              ]
            }).then(function (tag) {
              console.log(tag);
              BillService.setOrderTag($scope.header.DocNo, tag).then(function () {
                refresh();
              }, function (ex) {
                console.log(ex);
              });
            });
          }
          $scope.flag = false;
        },
        SearchTop: function (fn) {
          $scope.flag = true;
          if (authorityCheck(fn)) {
            if ($scope.modals.itemSearch) {
              $scope.shownModal = 'itemSearch';
              $scope.modals.itemSearch.show();
            }
          }
          $scope.flag = false;
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
          } else {
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
              onGoingFunction = fn;
            }
          }
        }

        // TODO: move this to function block
        AuthService.setTempUser(null);
        return authorized;
      };

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('modifier.modal.close', function () {
        if ($scope.modals.modifiers) {
          $scope.modals.modifiers.hide();
        }
      });

      $ionicModal.fromTemplateUrl('main/modifiers/modifierModal.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modals.modifiers = modal;
      });

      $scope.$on('voidBill.modal.close', function () {
        if ($scope.modals.voidBillModal) {
          $scope.modals.voidBillModal.hide();
          buttonClicked.voidBill = false;
        }
      });

      $scope.$on('recallSuspendBill.modal.close', function () {
        if ($scope.modals.recallSuspendBillModal) {
          $scope.modals.recallSuspendBillModal.hide();
          buttonClicked.recallSuspendBillModal = false;
          $scope.refreshCart();
        }
      });

      $ionicModal.fromTemplateUrl('main/items/itemSearch.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up',
        focusFirstInput: true
      }).then(function (modal) {
        $scope.modals.itemSearch = modal;
      });

      $scope.$on('ItemSearchModal.close', function (event, item) {
        if (item) {
          selectItem(item);
        }
        if ($scope.modals.itemSearch) {
          $scope.modals.itemSearch.hide();
        }
      });

      $ionicModal.fromTemplateUrl('main/items/itemDetailsModal.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modals.itemDetails = modal;
      });

      $scope.$on('itemDetailsModal-close', function (event) {
        if ($scope.modals.itemDetails) {
          $scope.modals.itemDetails.hide();
        }
      });

      $scope.barcodeSubmit = function (e) {
        e.preventDefault();
        if (!buttonClicked.barcode) {
          buttonClicked.barcode = true;
          // alert($scope.data.barcode);
          if ($scope.data.barcode && $scope.data.barcode != '') {
            Alert.showLoading();
            ItemService.getItemByBarcode($scope.data.barcode).then(function (item) {
              debugLog.log('Barcode : ' + $scope.data.barcode, 7);
              debugLog.log('Item : ' + item, 7);
              debugLog.log(item, 7);
              $timeout(function () {
                selectItem(item);
              }, 20);
            }, function (ex) {
              $cordovaToast.show(ex, 'long', 'top');
              // Alert.warning(ex);
            }).finally(function () {
              $scope.data.barcode = '';
              buttonClicked.barcode = false;
              document.getElementById('barcodeText').focus();
              $timeout(function () { Alert.hideLoading();}, 10);
            });
          }
        }
      };

      $scope.onBarcodeModeChange = function () {
        $scope.onBarcodeTextBlur();
      };

      $scope.onBarcodeTextBlur = function () {
        if ($scope.data.barcodeMode) {
          $scope.data.barcode = '';
          $timeout(function () {
            document.getElementById('barcodeText').focus();
          }, 500);
        } else {
          $timeout(function () {
            document.getElementById('barcodeText').blur();
          }, 500);
        }
      };

      $scope.$on('CartCheck', function () {
        if (_.isEmpty($scope.cart.items)) {
          $scope.$emit('BlockMenu', true);
        } else {
          $scope.$emit('BlockMenu', false);
        }
      });

    }]);
