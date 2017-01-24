/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("SalesCtrl", ['$scope', 'KeyBoardService', '$timeout', 'ItemService', 'SubPLU1Service', 'SubPLU2Service', 'SubPLU3Service', 'PriceGroupService', '$ionicModal',
      'AuthService', 'CartItemService', 'ControlService', 'ionicDatePicker', 'FunctionsService', '$filter', 'SalesKitService', 'DiscountService', 'BillService', 'ShiftService',
      'PWPService', '$ionicScrollDelegate', 'Alert',
      function ($scope, KeyBoardService, $timeout, ItemService, SubPLU1Service, SubPLU2Service, SubPLU3Service, PriceGroupService, $ionicModal,
      AuthService, CartItemService, ControlService, ionicDatePicker, FunctionsService, $filter, SalesKitService, DiscountService, BillService, ShiftService,
                                               PWPService,  $ionicScrollDelegate, Alert) {
      $scope.currentPage = {};
      $scope.pages = [];
      $scope.keys = [];
      $scope.layout = null;
      $scope.key = {};
      $scope.SubPLUList = [];
      $scope.modalData = {};
      $scope.cart = {};
      $scope.user = AuthService.currentUser();
      $scope.tempUser = null;
      $scope.salesKitUpdate = false;
      // var businessDate = $filter('date')(ControlService.getBusinessDate(), "yyyy-MM-dd");
      var businessDate = ControlService.getBusinessDate(true);
      $scope.salesKits = {
        list: {},
        selectedList: {},
        selected: {}
      };
      $scope.shownModal = null;
      $scope.pwp = null;
      $scope.qty = { value: 1 };
      $scope.modals = {
        modifiers: null
      };
      $scope.TakeAway = false;

      $scope.$on("$ionicView.beforeEnter", function(event, data){
        // handle event
        loadLayout();
        loadFunctions();
        refresh();
      });
          // $scope.$on("$ionicParentView.enter", function(event, data){
          //     console.log('parent.enter');
          // });
          //
          // $scope.$on("$ionicView.enter", function(event, data){
          //     console.log('enter');
          // });

      var refresh = function(){
        var rec_id = BillService.getCurrentReceiptId();
        return BillService.getHeader(rec_id).then(function(header){
          var promise;
          if(!header){
            promise = BillService.initHeader();
          } else {
            promise = BillService.getHeader();
          }
          return promise.then(function(header){
            // console.log(header);
            refreshCart();
            $scope.header = header;
          });
        });
      }

      /**
       * Fetches the function list and is devided into top section and bottom
       */
      var loadFunctions = function () {
        FunctionsService.getSalesFunctions().then(function (fns) {
          $scope.functions = fns;
        });
      }

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
        $scope.subPLUModal = modal;
      });

      /**
       * Manages the sub PLU modal close event
       */
      $scope.closeSubPLUModal = function () {
        $scope.subPLUModal.hide();
      }

      /**
       * Initiating tender modal dialog
       */
      $ionicModal.fromTemplateUrl('main/tender/tender.html', {
        scope: $scope,
        animation: 'slide-in-up',
        backdropClickToClose: false,
        buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
          text: 'Cancel',
          type: 'button-default',
          onTap: function(e) {
            // e.preventDefault() will stop the popup from closing when tapped.
            e.preventDefault();
          }
        }]
      }).then(function (modal) {
        $scope.tenderModal = modal;
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('tenderModel-close', function () {
        CartItemService.clearCart();
        refreshCart();
        $scope.tenderModal.hide();
        $scope.shownModal = null;

        // BillService.getHeader().then(function(header){
        //   var promise;
        //   if(!header){
        //     promise = BillService.initHeader();
        //   } else {
        //     promise = BillService.getHeader();
        //   }
        //   promise.then(function(header){
        //     // console.log(header);
        //     refreshCart();
        //     $scope.header = header;
        //   });
        // });
      });

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
        refreshCart();
      });


      /**
       * Initiating shift modal dialog
       */
      $ionicModal.fromTemplateUrl('main/salesKits/salesKit.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.skModalModal = modal;
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('skModalModal-close', function () {
        $scope.skModalModal.hide();
      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('skModalModal-save', function () {
        $scope.salesKitUpdate = false;
        $scope.skModalModal.hide();
      });

      /**
       * Initiating PWP modal dialog
       */


      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('pwpModal-close', function () {
        selectLastItem();
        $scope.qty.value = 1;
        $scope.pwpModal.remove();
      });

      /**
       * Biding an event to catch modal close call
       */
      // $scope.$on('pwpModal-save', function () {
      //   $scope.pwpModal.hide();
      // });

      /**
       * Initiating shift modal dialog
       */
      $ionicModal.fromTemplateUrl('main/login/loginModal.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.LoginlModal = modal;
        // $scope.LoginlModal.show();

      });

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('loginlModal-close', function () {
        $scope.LoginlModal.hide();
        // console.log(AuthService.getTempUser());
        if(onGoingFunction){
          $scope.invoke(onGoingFunction);
        }
      });


      /**
       * Loads the layout for sales keys & pages
       * @returns {*|Promise.<TResult>}
       */
      var loadLayout = function () {
          return KeyBoardService.getLayout().then(function (layout) {
            $scope.layout = layout;
            // console.log(layout.LayoutId);
            if (layout) {
              loadPages(layout.LayoutId);
            }
            return layout;
          })
        },
        loadPages = function (layoutId) {
          return KeyBoardService.getPages(layoutId).then(function (pages) {
            $scope.pages = pages;
            $scope.changePage(_.first($scope.pages), 1);
            loadKeys(layoutId);
            return $scope.currentPage;
          });
        },
        loadKeys = function (layoutId) {
          return KeyBoardService.getKeys(layoutId).then(function (keys) {
            var keyCount = $scope.pages.length * 32;
            var keySet = {};
            for (var i in _.range(1, keyCount + 1)) {
              keySet[i] = _.findWhere(keys, {KeyNo: parseInt(i)});
            }
            $scope.key = keySet[1];
            $scope.keys = keySet;
            $scope.range = _.range(1, 33);
            return keySet;
          });
        };
        // loadLayout();

      var errHandler = function (err) {
        console.log(err.message);
      }

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
        return _.findWhere($scope.keys, {KeyNo: keyNo})
      }


      /**
       * Manages the change page event
       * @param page
       * @param $index
       */
      $scope.changePage = function (page, $index) {
        $scope.pages = _.map($scope.pages, function (p, key) {
          p.selected = false;
          return p;
        });
        $scope.currentPage = page;
        page.selected = true;
        $scope.range = _.range((32 * $index) + 1, (32 * $index) + 33);

      }

      /**
       * Manages the sales item click event
       * @param item
       */
      $scope.onKeyClick = function (item) {
        if(item){
          // console.log(item);

          $scope.selectedItem = angular.copy(item);
          if (item.SubPLU1Code == "") {
            $scope.SubPLUList = [];
            SubPLU1Service.getAvailable(item.PLU).then(function (data) {
              $scope.SubPLUList = data;
              $scope.modalData = {title: "SubPLU 1 " + item.PLU, subPLU: 1};
              $scope.subPLUModal.show();
            });
          } else if (item.SubPLU2Code == "") {
            $scope.SubPLUList = [];
            SubPLU2Service.getAvailable(item.PLU).then(function (data) {
              $scope.SubPLUList = data;
              $scope.modalData = {title: "SubPLU 2 " + item.PLU, subPLU: 2};
              $scope.subPLUModal.show();
            });
          } else if (item.SubPLU3Code == "") {
            $scope.SubPLUList = [];
            ItemService.getAvailable(item.PLU).then(function (data) {
              $scope.SubPLUList = data;
              $scope.modalData = {title: "SubPLU 3 " + item.PLU, subPLU: 3};
              $scope.subPLUModal.show();
            });
          }
          fetchSelectedItem($scope.selectedItem);
        }
      }

      /**
       * Support function to fetch the selected item details
       * @param selectedItem
       */
      var fetchSelectedItem = function (selectedItem) {
        if (selectedItem.SubPLU1Code != "" && selectedItem.SubPLU2Code != "" && selectedItem.SubPLU3Code != "") {
          ItemService.get(selectedItem.PLU, selectedItem.SubPLU1Code, selectedItem.SubPLU2Code, selectedItem.SubPLU3Code).then(function (item) {
            SalesKitService.getSalesKit(item.Id, businessDate).then(function (salesKit) {
              if(salesKit){
                $scope.salesKits = salesKit;
                $timeout(function () {
                  $scope.shownModal = 'sk';
                  $scope.skModalModal.show();
                }, 300);


              } else {
                return ItemService.getPrice(item.Plu, parseInt(item.PriceGroupId)).then(function (data) {
                  item.Price = data ? data.Price : 0;
                  item.OrgPrice = data ? data.OrgPrice : 0;
                  item.AlteredPrice = data ? data.AlteredPrice : 0;
                  item.StdCost = data ? data.StdCost : 0;
                  item.PriceLevelId  = data ? data.PriceLevelId : 0;

                  item.ItemId = item.Id;
                  item.ItemType = 'NOR';
                  var customeQty = $scope.qty.value;
                  if(customeQty > 1){
                    item.customQuantity = customeQty;
                  }
                  if($scope.TakeAway){
                    item.TakeAway = true;
                  }
                  PWPService.getPWP(item, item.customQuantity || item.Qty).then(function(pwp){
                    if(pwp && ( (item.Qty >= pwp.Quantity) || item.customQuantity >= pwp.Quantity)){
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
                      ;
                    } else {
                      CartItemService.addItemToCart(item).then(function (it) {
                       refreshCart().then(function () {
                          $scope.qty.value = 1;
                          selectLastItem();
                        })
                      });
                    }
                  }, function(err){
                    console.log(err);
                  });

                }, function (err) {
                  throw new Error(err.message);
                });
              }

            }, function (err) {
              console.log(err);
            });

          }, function (err) {
            console.log(err.message);
            refreshCart();
          });
        }
      }

      /**
       * Manages the cart item click event
       * @param item
       */
      $scope.selectItem = function (item) {
        if(item){
          $scope.cart.items = _.map($scope.cart.items, function (item) {
            item.selected = false;
            return item;
          });
          item.selected = true;

        }
        $scope.cart.selectedItem = item;
      }

      /**
       * Manages the cart item click event inside sub PLU modal
       * @param item
       */
      $scope.onSubPLUClick = function (subPLU) {
        $scope.selectedItem["SubPLU" + $scope.modalData.subPLU + "Code"] = subPLU.Code;
        $scope.selectedItem["SubPLU" + $scope.modalData.subPLU + "Id"] = subPLU.Id;
        $scope.subPLUModal.hide();
        fetchSelectedItem($scope.selectedItem);
      }

      /**
       * Manages the open tender modal event
       * @param item
       */
      $scope.openTenderForm = function () {
        if(!_.isEmpty($scope.cart.items)){
          $scope.tenderModal.show();
          $scope.shownModal = 'tender';
        }
      }

      /**
       * Refreshes the cart data from it's service
       */
      var refreshCart = function () {
        return CartItemService.fetchItemsFromDb().then(function (items) {
          $scope.cart.items = items;
          $scope.cart.summery = CartItemService.getSummery();
            angular.forEach($scope.cart.items, function (item, key) {
              if($scope.cart.selectedItem && $scope.cart.selectedItem.ItemId == item.ItemId && $scope.cart.selectedItem.LineNumber == item.LineNumber){
                $scope.cart.items[key] = item;
                $scope.selectItem(item);
              }
              if(item.TakeAway == 'false'){
                $scope.TakeAway = false;
              }
            });

          $ionicScrollDelegate.scrollBottom(true);
        });

      }
      // refreshCart();

      $scope.$on("refresh-cart", function () {
        refreshCart();
      });


      /**
       * Invokes the given named function from $scope.salesFunctions
       * @param name
       */
      $scope.invoke = function (fn) {
        if (!_.isUndefined($scope.salesFunctions[fn.Name])) {
          $scope.salesFunctions[fn.Name](fn);
        } else {
          throw new Error("Function " + fn.Name + " is not available.");
        }
      }

      var selectLastItem = function () {
          if($scope.cart.items){
              var last = $scope.cart.items[Object.keys($scope.cart.items)[Object.keys($scope.cart.items).length-1]];
              if(last){
                $scope.selectItem(last);
              } else {
                $scope.selectItem(null);
              }
          }
      }

      /**
       * Contains the list of functions for sales
       * @type {{VoidTop: $scope.salesFunctions.VoidTop}}
       */
      $scope.salesFunctions = {
        VoidTop: function (fn) {
          var item = $scope.cart.selectedItem;
          if (item && authorityCheck(fn)) {
            if (item.ItemType == 'SKT') {
              BillService.voidSalesKit(item).then(function () {
                refreshCart();
              }, function (err) {
                console.log(err);
                refreshCart();
              });
            // } else if(){

            } else {
              console.log(item);
              if (item.ItemType == 'SKI') {
                if (item.Selectable == 'true') {
                  CartItemService.findSalesKitParent(item.ParentItemLineNumber).then(function (parentItem) {
                    SalesKitService.getSalesKit(parentItem.ItemId, businessDate).then(function (salesKit) {
                      if (salesKit) {
                        $scope.salesKits = salesKit;
                        $scope.salesKitUpdate = true;
                        $scope.skModalModal.show();
                      }
                    });
                  });
                }
              } else {
                BillService.voidItem(item).then(function () {
                  refreshCart().then(function () {
                    selectLastItem();
                  });

                }, function (err) {
                  console.log(err);
                  refreshCart().then(function () {
                    // console.log('void');
                    selectLastItem();
                  });
                });
              }
            }
          }
        },
        Discount: function (fn) {
          var item = $scope.cart.selectedItem;
          var condition = true;
          var errors = [];
          if(!item){
            errors.push("No item selected");
            condition = false;
          } else {
            if(!item){
              errors.push("No item selected");
              condition = false;
            }
            if(item.ItemType != 'NOR' && item.ItemType != 'SKT'){
              errors.push("Not an eligible item type");
              condition = false;
            }
            if(!DiscountService.checkItemEligibility(item)){
              errors.push("Not an eligible item");
              condition = false;
            }

            if(!authorityCheck(fn)){
              errors.push("Not authorized");
              condition = false;
            }
          }


          if (condition) {
            $scope.discountModal.show();
          } else {
            Alert.error(errors.join(" | "));
          }

        },
        QtyPlus: function (fn) {
          var item = $scope.cart.selectedItem;
          if(item && item.ItemType == 'NOR' && !ItemService.isDiscounted(item) && !ItemService.isRefunded(item)){
            if(authorityCheck(fn)){
              var qty = angular.copy(item.Qty);
              BillService.changeItemQty(item.ItemId, item.LineNumber, ++qty).then(function () {
                refreshCart();
              }, function (err) {
                console.log(err);
              });
            }
          }
        },
        QtyMinus: function (fn) {
          var item = $scope.cart.selectedItem;
          if(item && item.ItemType == 'NOR' && !ItemService.isDiscounted(item) && !ItemService.isRefunded(item)){
            if(authorityCheck(fn)){
              var qty = angular.copy(item.Qty);
              if(qty > 1){
                BillService.changeItemQty(item.ItemId, item.LineNumber, --qty).then(function () {
                  refreshCart();
                }, function (err) {
                  console.log(err);
                });
              }
            }
          }
        },
        ItemReverse: function (fn) {
          if(authorityCheck(fn)){
            var item = $scope.cart.selectedItem;
            if(item && item.ItemType == 'NOR'){
              $scope.refundModal.show();
            }
          }

        },
        CallSuspendBill: function (fn) {
          if(authorityCheck(fn)){
            console.log('tada');
          }
        },
        Shiftoption: function (fn) {
          if(authorityCheck(fn)){
            $scope.shiftOptionsModal.show();
          }
        },
        AbortFunction: function(fn){
          Alert.showConfirm('This will remove all the items', 'Abort?').then(function(res){
            if(res){

              BillService.getHeader().then(function(header){
                // $scope.tenderHeader = header;
                console.log($scope.header);
                $scope.header.DocType = 'AV';
                BillService.saveBill($scope.header, $scope.cart.items).then(function(res){
                  refresh();
                }, function(res){
                  console.log(res);
                });
              });
            }
          });
        },
        FoodModifier: function(fn){
          $scope.type = 'F';
          $scope.modals.modifiers.show();
        },
        BeveragesModifiers: function(fn){
          $scope.type = 'B';
          $scope.modals.modifiers.show();
        },
        PartialTakeaway: function(fn){
          if(authorityCheck(fn)){
            var item = $scope.cart.selectedItem;
            if(item){
              BillService.setTakeAway(item.TakeAway == 'false' ? true : false, item.ItemId, item.LineNumber).then(function(){
                // console.log("done");
                refresh();
              }, function(ex){
                console.log(ex);
              })
            }
          }
        },
        FullTakeaway: function(fn){
          if(authorityCheck(fn)){
            $scope.TakeAway = !$scope.TakeAway;
            BillService.fullTakeAway($scope.cart.items, $scope.TakeAway).then(function(){
              refresh();
            }, function(ex){
              console.log(ex);
            });

          }
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

      /**
       * Biding an event to catch modal close call
       */
      $scope.$on('modifier.modal.close', function () {
        if($scope.modals.modifiers){
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


          loadLayout();
          loadFunctions();
          refresh().then(function(){
              selectLastItem();
          });



    }]);
