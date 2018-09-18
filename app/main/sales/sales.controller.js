/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller('SalesCtrl', ['$scope', 'KeyBoardService', '$timeout', 'ItemService', 'SubPLU1Service', 'SubPLU2Service', 'SubPLU3Service', 'PriceGroupService', '$ionicModal', '$http', 'SettingsService',
    'AuthService', 'CartItemService', 'ControlService', 'ionicDatePicker', 'FunctionsService', '$filter', 'SalesKitService', 'DiscountService', 'BillService', 'ShiftService', 'LogService',
    'PWPService', '$ionicScrollDelegate', 'Alert', '$q', '$ionicPopup', 'header', 'user', 'shift', '$state', '$rootScope', 'Reciept', '$cordovaToast', 'SuspendService', 'AppConfig', 'Restangular',
    function ($scope, KeyBoardService, $timeout, ItemService, SubPLU1Service, SubPLU2Service, SubPLU3Service, PriceGroupService, $ionicModal, $http, SettingsService,
              AuthService, CartItemService, ControlService, ionicDatePicker, FunctionsService, $filter, SalesKitService, DiscountService, BillService, ShiftService, LogService,
              PWPService, $ionicScrollDelegate, Alert, $q, $ionicPopup, header, user, shift, $state, $rootScope, Reciept, $cordovaToast, SuspendService, AppConfig, Restangular) {
      $scope.showpwpModal = false;
      $scope.showskModalModal = false;
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();
      debugLog = LogService.StartDebugLog();

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

      var requestUrl = AppConfig.getDisplayUrl() + '/Item';
      console.log(requestUrl);
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
          Alert.warning('Date is not valid');
          eventLog.log('date is not valid');
          console.log('date is not valid');
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
        eventLog.log('shift-changed');
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
              eventLog.log('refresh' + ex);
              console.log(ex);
            });
          } else {
            $scope.header = header;
            return true;
          }
        }, function (ex) {
          eventLog.log('refresh' + ex);
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
        eventLog.log('Item Discount Done.');
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
        eventLog.log('pwp model closed ');
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
        eventLog.log('pwp model saved ');
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
          // if ( first == 0 || first == 00) {
          if ( first == 0 ) {
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
        } else if (temp.length >= 2) {
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
            // eventLog.log('loadLayout : Done');
            return layout;
          });
        },

        loadPages = function (layoutId) {
          return KeyBoardService.getPages(layoutId).then(function (pages) {
            $scope.keyboard.pages = pages;
            loadKeys(layoutId);
            // eventLog.log('loadPages : Done');
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
            // eventLog.log('loadKeys : Done');
            return keys;
          });
        };
      // loadLayout();

      var errHandler = function (err) {
        errorlog.log(err.message);
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
        eventLog.log('Add Item');
        // console.time("test");
        $timeout(function () {
          // $timeout.flush();

          $scope.$emit('BlockMenu', false);
          $scope.bkey = true;
          Alert.showLoading();
          $scope.data.barcodeMode = false;
          if (item) {
            if (item.Type == 'P') {
              eventLog.log('ItemType : P (getActiveKeys)');
              $scope.keyboard.activeKeys = getActiveKeys(item.SubPage);
              return false;
            }
            eventLog.log('Item Retrieve SubPLUCode : Start');
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
            eventLog.log('Item Retrieve SubPLUCode : Done');
            fetchSelectedItem($scope.selectedItem);
            $timeout(function () { Alert.hideLoading();}, 30);
            $timeout(function () { $scope.bkey = false; }, 500); // in case of increase the waiting time

          }
        }, 5);
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
        eventLog.log('Sale Item Data Retrieve Start ');
        if ($scope.qty.value == '') {
          $scope.qty.value = 1;
        }
        SalesKitService.getSalesKit(item.Id, businessDate).then(function (salesKit) {
          console.log(salesKit);
          // eventLog.log('Retrieve Salekit Data Done ');
          if (salesKit && !salesKit.isEmpty) {
            if ($scope.showskModalModal == false) {
              // eventLog.log('selectItem Salekit Start ');
              $scope.showskModalModal = true;
              $timeout(function () {
                $scope.modals.salesKit.data = {
                  salesKit: salesKit,
                  update: false
                };
                if (Object.keys(salesKit.component).length != 0) {
                  eventLog.log('selectItem Salekit Option 1 (Changable)');
                  $scope.modals.salesKit.show();
                } else {
                  eventLog.log('selectItem Salekit Option 2 (Not changable) ');
                  $scope.$broadcast('save', salesKit);
                }
              }, 200);
              // eventLog.log('selectItem Salekit Done ');
            }
          } else {
            // eventLog.log('selectItem (NOR & PWP) Start ');
            return ItemService.getPrice(item.Plu, parseInt(item.PriceGroupId)).then(function (data) {
              eventLog.log('selectItem GetPrice : Start');
              var q = null;
              if (data) {
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
                eventLog.log('selectItem GetPrice : Done');

                PWPService.getPWP(item, item.customQuantity || item.Qty).then(function (pwp) {
                  if (item.Qty == undefined) {
                    item.Qty = 0;
                    if (item.customQuantity == undefined) {
                      item.customQuantity = 1;
                    }
                  }
                  if (pwp && ( (item.Qty >= pwp.Quantity) || item.customQuantity >= pwp.Quantity) && pwp != true) {
                    eventLog.log('selectItem PWP Start ');
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
                      eventLog.log('selectItem PWP Done ');
                    }
                  } else if (pwp == true) {
                    $scope.$emit('BlockMenu', true);
                  } else {
                    eventLog.log('selectItem Normal Start ');
                    CartItemService.addItemToCart($scope.header.DocNo, item).then(function (it) {
                      $scope.refreshCart().then(function () {
                        //$scope.scrollTo(it.LineNumber);
                        $scope.qty.value = 1;
                        $scope.selectItemWithLineNumber(it.LineNumber);
                        $scope.PostApi(it);
                      });
                      eventLog.log('selectItem Normal Done');
                    }, function (ex) {
                      errorLog.log('selectItem Normal Error ' + ex);
                      console.log(ex);
                    });
                  }
                }, function (err) {
                  errorLog.log('selectItem PWP Error ' + err.message);
                  console.log(err);
                });
              });

            }, function (err) {
              errorLog.log('selectItem GetPrice Error ' + err.message);
              Alert.error(err.message);
            });
          }

        }, function (err) {
          errorLog.log('selectItem SaleKit Error ' + err.message);
          console.log(err);
        });
        LogService.SaveLog();
      };

      /**
       * Support function to fetch the selected item details
       * @param selectedItem
       */
      var fetchSelectedItem = function (selectedItem) {
        eventLog.log('fetchSelectedItem : Start');
        if (selectedItem.SubPLU1Code != '' && selectedItem.SubPLU2Code != '' && selectedItem.SubPLU3Code != '') {
          ItemService.get(selectedItem.PLU, selectedItem.SubPLU1Code, selectedItem.SubPLU2Code, selectedItem.SubPLU3Code).then(function (item) {
            eventLog.log('fetchSelectedItem : Done');
            eventLog.log('selectItem : Start');
            $timeout(function () { selectItem(item);}, 100);
            eventLog.log('selectItem : Done');
          }, function (err) {
            errorLog.log('fetchSelectedItem Error : ' + err.message);
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
          $timeout(function () {
            $state.go('app.tender', {DocNo: $scope.header.DocNo});
          });
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
        angular.forEach($scope.cart.items, function (Ditem) {
          if (it.update == 1) {
            if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
              $scope.PutFunction(Ditem);
            }
          } else {
            if (type == 1) { // SaleKit
              if ((it[0].ItemType == Ditem.ItemType) && (it[0].ItemId == Ditem.ItemId) && (it[0].LineNumber == Ditem.LineNumber)) {
                $scope.PostFunction(Ditem);
              }
              angular.forEach(it[0].selectedList, function (Citem) {
                if ((Citem.ItemType == Ditem.ItemType) && (Citem.ItemId == Ditem.ItemId) && (Citem.LineNumber == Ditem.LineNumber)) {
                  $scope.PostFunction(Ditem);
                }
              });
            } else if (type == 2) { // PWP
              angular.forEach(it, function (Citem) {
                if ((Citem.ItemType == Ditem.ItemType) && (Citem.ItemId == Ditem.ItemId) && (Citem.LineNumber == Ditem.LineNumber)) {
                  $scope.PostFunction(Ditem);
                }
              });
            } else if (type == 3) { // SKI non-void
              console.log(it);
            } else if (type == 4) { // SKI update
              if (updatenewitem < control) {
                if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
                  // if (TempDeleteItem != null && (it.ItemType == TempDeleteItem.ItemType) && (it.ItemId == TempDeleteItem.ItemId)) {
                    // console.log('401 : update');
                  it.LineNumber = TempDeleteItem.LineNumber;
                  $scope.DeleteFunction(TempDeleteItem);
                  $scope.PostFunction(Ditem, 1);
                  // } else {
                    // console.log('402 : put');
                  //   $scope.PutFunction(Ditem, 1);
                  // }
                  control = control - it.Qty;
                }
              } else {
                if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
                  // console.log('43 : post');
                  $scope.PostFunction(Ditem, 1);
                }
              }
              // if (TempDeleteItem != null &&(it.ItemType == TempDeleteItem.ItemType) && (it.ItemId == TempDeleteItem.ItemId)) {
              //   console.log("this one " + it.LineNumber);
              //   it.LineNumber = it.LineNumber - 10;
              //   $scope.PutFunction(it, 1);} else
              // if (updatenewitem == 0) {
              //   if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
              //     updatenewitem ++;
              //     $scope.PutFunction(Ditem, 1);
              //   }
              // } else if (control == updatenewitem) {
              //   updatenewitem = 0;
              // } else {
              //   if ((it.ItemType == Ditem.ItemType) && (it.ItemId == Ditem.ItemId) && (it.LineNumber == Ditem.LineNumber)) {
              //     updatenewitem ++;
              //     $scope.PostFunction(Ditem, 1);
              //   }
              // }
            } else if (type == 5) { // F/B Modifier
              angular.forEach(it, function (Citem) {
                if ((Citem.ItemType == Ditem.ItemType) && (Citem.ItemId == Ditem.ItemId) && (Citem.LineNumber == Ditem.LineNumber)) {
                  // console.log('gg2');
                  setTimeout(function () { $scope.DeleteApi(Ditem); }, 10);
                  setTimeout(function () {
                    $scope.PostFunction(Ditem);
                  }, 200);
                }
              });
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
            'itemDescription': Nitem.Desc1,
            'itemQuantity': Nitem.Qty,
            'itemTotal': Nitem.Total,
            'itemDiscount': Nitem.Discount + Nitem.Tax5DiscAmount || Nitem.DiscAmount + Nitem.Tax5DiscAmount,
            'itemOrgPrice': Nitem.OrgPrice,
            'itemOrderedDateTime': moment(Nitem.OrderedDateTime).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
            'machineId': Nitem.MachineId,
            'locationId': Nitem.LocationId,
            'docNo': Nitem.DocNo,
            'itemType': Nitem.ItemType,
            'itemId': Math.floor(Nitem.ItemId),
            'lineNumber': Nitem.LineNumber,
            'parentItemLineNumber': Nitem.ParentItemLineNumber
          }
        }).then(function successCallback (response) {
          // console.log('Post : ' + Nitem.Desc1);
          // console.log(response);
          eventLog.log('2nd Display: Post Success');
        }, function errorCallback (response) {
          // console.log(response);
          errorLog.log('2nd Display Post Fail : ' + response.status + ' ' + response.statusText);
        });
      };

      $scope.PutFunction = function (Nitem, upf) {
        // console.log('put');
        if (TempDeleteItem != null && upf == 1) {
          PrevItemId = Math.floor(TempDeleteItem.ItemId);
          TempDeleteItem = null;
        } else {
          PrevItemId = Math.floor(Nitem.ItemId);
        }
        // console.log(PrevItemId);
        Qty = Nitem.Qty;
        DiscAmount = Nitem.Discount = Nitem.DiscAmount;
        $http({
          method: 'PUT',
          url: requestUrl,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            'itemDescription': Nitem.Desc1,
            'itemQuantity': Qty,
            'itemTotal': Nitem.Total,
            'itemDiscount': DiscAmount + Nitem.Tax5DiscAmount,
            'itemOrgPrice': Nitem.OrgPrice,
            'itemOrderedDateTime': moment(Nitem.OrderedDateTime).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
            'machineId': Nitem.MachineId,
            'locationId': Nitem.LocationId,
            'docNo': Nitem.DocNo,
            'itemType': Nitem.ItemType,
            'itemId': Math.floor(Nitem.ItemId),
            'previousItemId': PrevItemId,
            'lineNumber': Nitem.LineNumber,
            'parentItemLineNumber': Nitem.ParentItemLineNumber
          }
        }).then(function successCallback (response) {
          eventLog.log('2nd Display: Update Success');
          // console.log('Update : ' + Nitem.Desc1);
          // console.log(response);
        }, function errorCallback (response) {
          errorLog.log('2nd Display Update Fail : ' + response.status + ' ' + response.statusText);
          // console.log(response);
        });
      };

      /**
       * Secondary display Delete
       */
      var delpwp = 0;
      $scope.DeleteApi = function (item) {
        if (item) {
          if (item.ItemType == 'SKT' || item.ItemType == 'NOR' ) { // SaleKit + Normal
            angular.forEach($scope.cart.items, function (Ditem) {
              if (Ditem.ItemType == 'MOD' && Ditem.ParentItemLineNumber == item.LineNumber) {
                angular.forEach($scope.cart.items, function (Pitem) {
                  if (Pitem.LineNumber == Ditem.ParentItemLineNumber) {
                    $scope.DeleteFunction(Ditem);
                    $scope.DeleteFunction(Pitem);
                  }
                });
              }
              else if (Ditem.ParentItemLineNumber == item.LineNumber) {
                $scope.DeleteFunction(Ditem);
              } else {
                $scope.DeleteFunction(item);
              }
            });
          } else if (item.ItemType == 'PWP') {
            $scope.DeleteFunction(item);
            delpwp = 1;
            if (delpwp == 1) {
              angular.forEach($scope.cart.items, function (Ditem) {
                if (Ditem.ItemType == 'MOD') {
                  angular.forEach($scope.cart.items, function (Pitem) {
                    if (Pitem.LineNumber == Ditem.ParentItemLineNumber) {
                      $scope.DeleteFunction(Ditem);
                      $scope.DeleteFunction(Pitem);
                    }
                  });
                }
                else if (Ditem.ParentItemLineNumber == item.LineNumber) {
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
        }).then(function successCallback (response) {
          console.log('Delete');
          console.log(response);
          eventLog.log('2nd Display: Delete All Success');
        }, function errorCallback (response) {
          console.log(response);
          errorLog.log('2nd Display Delete All Fail : ' + response.status + ' ' + response.statusText);
        });
      };

      $scope.DeleteFunction = function (Ditem) {
        $http({
          method: 'DELETE',
          url: requestUrl,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            'itemDescription': Ditem.Desc1,
            'itemQuantity': Ditem.Qty,
            'itemTotal': Ditem.Total,
            'itemDiscount': Ditem.Discount + Ditem.Tax5DiscAmount,
            'itemOrgPrice': Ditem.OrgPrice,
            'itemOrderedDateTime': moment(Ditem.OrderedDateTime).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
            'machineId': Ditem.MachineId,
            'locationId': Ditem.LocationId,
            'docNo': Ditem.DocNo,
            'itemType': Ditem.ItemType,
            'itemId': Math.floor(Ditem.ItemId),
            'lineNumber': Ditem.LineNumber,
            'parentItemLineNumber': Ditem.ParentItemLineNumber
          }
        }).then(function successCallback (response) {
          eventLog.log('2nd Display: Delete Success');
          // console.log('Delete : ' + Ditem.Desc1);
          // console.log(response);
        }, function errorCallback (response) {
          // console.log(response);
          errorLog.log('2nd Display Delete Fail : ' + response.status + ' ' + response.statusText);
        });
      };

      /**
       * Refreshes the cart data from it's service
       */
      $scope.refreshCart = function (susp) {
        // console.log('susp : ' + susp);
        return CartItemService.fetchItemsFromDb().then(function (items) {
          $scope.cart.items = items;
          // console.log($scope.cart.items);
          // var last = Object.keys($scope.cart.items).length - 1;
          // if (last < 0) {
          //   $scope.DeleteApi();
          // }

          angular.forEach($scope.cart.items, function (Ditem) {
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
          LogService.SaveLog();

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
          errorLog.log('Function ' + fn.Name + ' is not available.');
          throw new Error('Function ' + fn.Name + ' is not available.');
        }
      };

      $scope.selectItemWithLineNumber = function (lineNumber) {
        eventLog.log('selectItemWithLineNumber : Start');
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
          eventLog.log('selectItemWithLineNumber : Done');
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
      };
      /**
       * Contains the list of functions for sales
       * @type {{VoidTop: $scope.salesFunctions.VoidTop}}
       */
      $scope.flag = false;
      $scope.salesFunctions = {
        VoidTop: function (fn) {
          eventLog.log('Void Function : Start');
          Suspended = false;
          // $scope.flag = true;
          Alert.showLoading();
          var item = $scope.cart.selectedItem;
          // var last = Object.keys($scope.cart.items).length - 1;
          // if (last == 0) {
          //   $scope.DeleteApi();
          // }
          if (item) {
            // console.log(item.ItemType);
            if (item.ItemType == 'PWI') {
              if (item.SuspendDepDocNo != '' && item.SuspendDepDocNo != null) {
                eventLog.log('Suspended PWI Item Void not allowed.');
                Alert.warning('Item Void not allowed.', 'ItouchLite');
              } else {
                Alert.warning('Item Void not allowed.', 'ItouchLite');// TO DO : ADD reslect option for pwp child
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
            } else if (item.ItemType == 'SKT' || item.ItemType == 'PWP') {
              if (item.SuspendDepDocNo != '' && item.SuspendDepDocNo != null) {
                eventLog.log('Suspended SKT & PWP Item Void not allowed.');
                Alert.warning('Item Void not allowed.', 'ItouchLite');
              } else {
                $scope.DeleteApi(item);
                BillService.voidSalesKit(item).then(function () {
                  $scope.refreshCart().then(function () {
                    $scope.selectItemWithLineNumber();
                  });
                  $scope.navMenuCtrl();
                }, function (err) {
                  errorLog.log('VoidTop SKT & PWP Error : ' + err);
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
                              updatenewitem = TempDeleteItem.Qty - 1;
                              $scope.modals.salesKit.show();
                            }
                          }, 500);

                        }
                      }, function (ex) {
                        errorLog.log('VoidTop SKI Error : ' + ex);
                        console.log(ex);
                      });
                    });
                  }
                } else {
                  eventLog.log('Unchangable SKI Item Void not allowed.');
                  Alert.warning('This item is unchangable', 'ItouchLite');
                }
              } else {
                if (item.SuspendDepDocNo != '' && item.SuspendDepDocNo != null) {
                    //window.alert('Item Void not allowed.');
                  eventLog.log('Suspended NOR Item Void not allowed.');
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
                    errorLog.log('VoidTop NOR Error : ' + err);
                    console.log(err);
                  });
                }
              }
            }
            eventLog.log('Void Function : Done');
            $timeout(function () { Alert.hideLoading();}, 20);
            $scope.navMenuCtrl();
          } else {
            if (!buttonClicked.voidBill) {
              buttonClicked.voidBill = true;
              if (authorityCheck(fn)) {
                eventLog.log('Void Bill Start.');
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
                  eventLog.log('Void Bill Done.');
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
            eventLog.log('Item Discount Start.');
            $ionicScrollDelegate.scrollTop();
            /*--*/
            var item = $scope.cart.selectedItem;
            if (item) {
              var condition = true;
              var errors = [];
              if (!item) {
                errorLog.log('No item selected @ Discount 1');
                errors.push('No item selected');
                condition = false;
              } else {
                if (!item) {
                  eventLog.log('No item selected @ Discount 2');
                  errors.push('No item selected');
                  condition = false;
                }
                if (item.ItemType != 'NOR' && item.ItemType != 'SKT' && item.ItemType != 'PWP') {
                  errorLog.log('Discount : Not an eligible item type');
                  errors.push('Not an eligible item type');
                  condition = false;
                }
                else if (!DiscountService.checkItemEligibility(item)) {
                  errorLog.log('Discount checkItemEligibility : Not an eligible item type');
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
              eventLog.log('Item Discount Done.');
            }
          }

        },
        QtyPlus: function (fn) {
          // $scope.flag = true;
          Alert.showLoading();
          var item = $scope.cart.selectedItem;
          if (Suspended == true && item.SuspendDepDocNo !== '') {
            eventLog.log('QtyPlus : Suspended Order: Action not allowed.');
            Alert.warning('Suspended Order: Action not allowed.');
          } else if (item.SuspendDepDocNo === '') {
            eventLog.log('QtyPlus : Start');
            if (item && item.ItemType == 'NOR' && !ItemService.isDiscounted(item) && !ItemService.isRefunded(item)) {
              if (authorityCheck(fn)) {
                var qty = angular.copy(item.Qty);
                BillService.changeItemQty(item.DocNo, item.ItemId, item.LineNumber, ++qty).then(function () {
                  $scope.refreshCart().then(function () {
                    $scope.selectItemWithLineNumber(item.LineNumber);
                  });
                }, function (err) {
                  errorLog.log('QtyPlus Error:' + err);
                  console.log(err);
                });
              }
            }
            eventLog.log('QtyPlus : Done');
          }
          $timeout(function () { Alert.hideLoading();}, 20);
        },
        QtyMinus: function (fn) {

          var item = $scope.cart.selectedItem;
          if (Suspended == true && item.SuspendDepDocNo !== '') {
            eventLog.log('QtyMinus : Suspended Order: Action not allowed.');
            Alert.warning('Suspended Order: Action not allowed.');
          } else if (item.SuspendDepDocNo === '') {
            // $scope.flag = true;
            eventLog.log('QtyMinus : Start');
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
                    errorLog.log('QtyMinus Error:' + err);
                    console.log(err);
                  });
                } else {
                  Alert.warning('Minimum Quantity: Action not allowed.');
                  eventLog.log('QtyMinus : Minimum Quantity: Action not allowed.');
                  // $scope.flag = false;
                }
              }
              eventLog.log('QtyMinus : Done');
            }
            $timeout(function () { Alert.hideLoading();}, 20);
          }

        },
        ItemReverse: function (fn) {
          if (authorityCheck(fn)) {
            var item = $scope.cart.selectedItem;
            if (item.SuspendDepDocNo != '') {
              Alert.warning('Item refund not allowed.');
              eventLog.log('ItemReverse : Item refund not allowed');
            }
            else {
              eventLog.log('ItemReverse : Start');
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
              eventLog.log('ItemReverse : Done');
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
                  eventLog.log('ReCallSuspendBill : Start');
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
                else {
                  eventLog.log('ReCallSuspendBill : Fail Authority Check');
                  refresh();
                  buttonClicked.recallSuspendBillModal = false;
                }
                $scope.flag = false;
              } else {
                eventLog.log('SuspendBill : Start');
                $scope.flag = true;
                Alert.showLoading();
                SuspendService.suspend($scope.header.DocNo, Suspended, item.SuspendDepDocNo).then(function () {
                  Suspended = true;
                  $scope.DeleteApi();
                  refresh();
                }, function (ex) {
                  console.log(ex);
                }).finally(function () {
                  buttonClicked.recallSuspendBillModal = false;
                  Alert.success('Suspend completed');
                  eventLog.log('SuspendBill : Done');
                  $scope.$emit('BlockMenu', true);
                  Alert.hideLoading();
                  $scope.flag = false;
                });

              }
            });
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
              Alert.showConfirm('This will remove all the items', 'Abort?', function (res) { //
                if (res == 1) { //
                  eventLog.log('AbortFunction : Start');
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
                                eventLog.log('AbortFunction : Invalid service');
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
                  eventLog.log('AbortFunction : Done');
                } //
              }); //
            } else {
              eventLog.log('AbortFunction : Void');
              Alert.warning('No items in the cart!');
            }
            $scope.flag = false;
          }

        },
        FoodModifier: function (fn) {
          var item = $scope.cart.selectedItem;
          if (Suspended == true && item.SuspendDepDocNo !== '') {
            Alert.warning('Suspended Order: Action not allowed.');
            eventLog.log('FoodModifier : Suspended Order: Action not allowed');
          } else if (authorityCheck(fn)) {
            eventLog.log('FoodModifier : Start');
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
            eventLog.log('BeveragesModifiers : Suspended Order: Action not allowed');
          } else if (authorityCheck(fn)) {
            eventLog.log('BeveragesModifiers : Start');
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
              eventLog.log('PartialTakeaway : Start');
              BillService.setTakeAway(item.TakeAway == 'false' ? true : false, item.ItemId, item.LineNumber).then(function () {
                // console.log("done");
                $scope.refreshCart();
              }, function (ex) {
                errorLog.log('PartialTakeaway : Error' + ex);
                console.log(ex);
              });
              eventLog.log('PartialTakeaway : Done');
            }
          }
        },
        FullTakeaway: function (fn) {
          if (authorityCheck(fn)) {
            $scope.TakeAway = !$scope.TakeAway;
            eventLog.log('FullTakeaway : Start');
            BillService.fullTakeAway($scope.cart.items, $scope.TakeAway).then(function () {
              $scope.refreshCart();
            }, function (ex) {
              errorLog.log('FullTakeaway : Error' + ex);
              console.log(ex);
            });
            eventLog.log('FullTakeaway : Done');
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
            eventLog.log('ItemDetailTop : Start');
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
            eventLog.log('OrderTag : Start');
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
              // console.log(tag);
              BillService.setOrderTag($scope.header.DocNo, tag).then(function () {
                refresh();
              }, function (ex) {
                eventLog.log('OrderTag : Error ' + ex);
                console.log(ex);
              });
            });
            eventLog.log('OrderTag : Done');
          }
          $scope.flag = false;
        },
        SearchTop: function (fn) {
          $scope.flag = true;
          if (authorityCheck(fn)) {
            eventLog.log('Item Search : Start');
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
            eventLog.log('AuthorityCheck : Authorized!');
            authorized = true;
          } else {
            eventLog.log('AuthorityCheck : Access denied!');
            Alert.warning('Access denied!');
          }
        } else {
          if (AuthService.isAuthorized(fn.AccessLevel, AuthService.currentUser())) {
            eventLog.log('AuthorityCheck : Authorized!');
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
          eventLog.log('F&BModifier : Done');
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
          eventLog.log('ReCallSuspendBill : Done');
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
          eventLog.log('Item Search : Done');
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
          eventLog.log('ItemDetailTop : Done');
          $scope.modals.itemDetails.hide();
        }
      });

      $scope.barcodeSubmit = function (e) {
        e.preventDefault();
        $scope.data.Submit = false;
        debugLog.log('Barcode barcodeSubmit Mode : ' + buttonClicked.barcode);
        if (!buttonClicked.barcode) {
          debugLog.log('--*-- Read Barcode : Start --*--');
          buttonClicked.barcode = true;
          Alert.showLoading();
          debugLog.log('Barcode : ' + $scope.data.barcode);
          if ($scope.data.barcode && $scope.data.barcode != '' && $scope.data.barcode != undefined) {
            if ($scope.data.barcode == undefined) {
              $scope.data.barcode = '';
              debugLog.log('Barcode : Undefined');
              // Alert.warning('Try Again : 2');
            } else {
              ItemService.getItemByBarcode($scope.data.barcode).then(function (item) {
                debugLog.log('Barcode : ' + $scope.data.barcode);
                debugLog.log('Item Desc' + item.Description1);
                $timeout(function () {
                  selectItem(item);
                }, 20);
              }, function (ex) {
                debugLog.log('Barcode Error : ' + ex);
                $cordovaToast.show(ex, 'long', 'top');
                // Alert.warning(ex);
              }).finally(function () {
                $scope.data.barcode = '';
                buttonClicked.barcode = false;
                document.getElementById('barcodeText').focus();
              });
            }
          } else {
            // console.log('fail');
            $scope.data.barcode = '';
            buttonClicked.barcode = false;
            document.getElementById('barcodeText').focus();
            debugLog.log('Barcode : Try Again');
            // Alert.warning('Try Again');
          }
          debugLog.log('--*-- Read Barcode : Complete --*--');
          LogService.SaveLog();
          // $scope.data.Submit = true;
          $timeout(function () { $scope.data.Submit = true; $scope.onTextBlur();}, 500);
          $timeout(function () { Alert.hideLoading();}, 10);
        }
      };

      setInterval(function () {
        $scope.data.Submit = true;
      }, 500);

      $scope.onBarcodeModeChange = function () {
        debugLog.log('--*-- onBarcodeModeChange --*--');
        $scope.onBarcodeTextBlur();
      };

      $scope.onBarcodeTextBlur = function () {
        console.log('BarcodeMode : ' + $scope.data.barcodeMode);
        debugLog.log('BarcodeMode : ' + $scope.data.barcodeMode);

        if ($scope.data.barcodeMode) {
          $scope.data.barcode = '';
          if ($scope.data.Submit == false) {
            $scope.data.Submit = true;
            $scope.onTextBlur();
          }
          $timeout(function () {
            debugLog.log('BarcodeMode : Focus');
            document.getElementById('barcodeText').focus();
          }, 500);
        } else {
          $scope.data.Submit = false;
          $timeout(function () {
            debugLog.log('BarcodeMode : Blur');
            document.getElementById('barcodeText').blur();
          }, 500);
        }
        LogService.SaveLog();
      };

      $scope.onModeChange = function () {
        $scope.onTextBlur();
      };

      $scope.onTextBlur = function () {
        console.log('data.Submit : ' + $scope.data.Submit);
        debugLog.log('data.Submit : ' + $scope.data.Submit);
        if ($scope.data.barcodeMode) {
          if ($scope.data.Submit) {
            $scope.data.barcode = '';
            $timeout(function () {
              debugLog.log('Submit : ON');
              document.getElementById('barcodeText').focus();
            }, 500);
          } else {
            $timeout(function () {
              debugLog.log('Submit : OFF');
              document.getElementById('barcodeText').blur();
            }, 500);
          }
        } else {
          $timeout(function () {
            debugLog.log('Submit : OFF');
            document.getElementById('barcodeText').blur();
          }, 500);
        }
        LogService.SaveLog();
      };

      $scope.$on('CartCheck', function () {
        if (_.isEmpty($scope.cart.items)) {
          $scope.$emit('BlockMenu', true);
        } else {
          $scope.$emit('BlockMenu', false);
        }
      });

    }]);
