
angular.module('itouch', [
  'ionic',
  'ngCordova',
  'ui.router',
  'ngStorage',
  'restangular',
  'ngOrderObjectBy',
  'ionic-datepicker',
  'angularMoment',
  'ionic-numberpicker',
  'itouch.logger',
  'itouch.config',
  'itouch.controllers',
  'itouch.services'
    // TODO: load other modules selected during generation
])
    .run(['$ionicPlatform', 'DB', 'PrintService', 'Alert', 'UploadService', function ($ionicPlatform, DB, PrintService, Alert, UploadService) {
      // console.error = Rollbar.error;
      // console.warn = Rollbar.warning;
      // console.info = Rollbar.info;
      // console.debug = Rollbar.debug;

// Duplicated use of Rollbar.info for console.log since an equivalent does not exist
//       console.log = Rollbar.info;

      PrintService.setIPAddress('192.168.1.204');
      PrintService.setPort('8008');
      // PrintService.connect('192.168.1.205', '8008').then(function(){
      //   // Alert.success('Success');
      //   PrintService.onOffline(function(){
      //     Alert.success('Printer offline', 'offline');
      //   });
      //
      //   PrintService.onRecieve(function(){
      //     // Alert.success('Printer offline', 'offline');
      //   });
      // }, function(err){
      //   // Alert.success(err, 'Error');
      // });
      $ionicPlatform.ready(function () {
        DB.init();
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);

        }
        if (window.StatusBar) {
                // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        }

        UploadService.startAutoUpload();

      });
    }])

    .config(['$stateProvider', '$urlRouterProvider', 'RestangularProvider', '$provide', 'ionicDatePickerProvider', '$localStorageProvider',
      function ($stateProvider, $urlRouterProvider, RestangularProvider, $provide, ionicDatePickerProvider, $localStorageProvider) {

          // RollbarProvider.init({
          //   accessToken: 'c141337316fb46668bcbb9575b9cd911',
          //   captureUncaught: true,
          //   payload: {
          //     environment: 'ionic',
          //     device: 'IMac'
          //   }
          // });
          // $localStorageProvider.set('itouchConfig', {
          //   baseUrl: 'http://172.16.110.99/iTouchLiteSyncServices/iTouchLiteSyncService.svc/',
          //   name: 'ITouch Lite',
          //   version: '0.1',
          //   debug: true
          // });
        var appConfig = $localStorageProvider.get('itouchConfig');
        if (appConfig) {
          RestangularProvider.setBaseUrl(appConfig.baseUrl);
        }

        $stateProvider
                .state('login', {
                  url: '/login',
                  templateUrl: 'main/login/login.html',
                  controller: 'LoginCtrl as ctrl'
                })

                .state('settings', {
                  url: '/settings',
                  templateUrl: 'main/settings/settings.html',
                  controller: 'SettingsCtrl'
                })

                .state('app', {
                  url: '/app',
                  abstract: true,
                  templateUrl: 'main/menu.html',
                  controller: 'AppCtrl'
                })

                .state('app.home', {
                  url: '/home',
                  views: {
                    'menuContent': {
                      templateUrl: 'main/home/home.html',
                      controller: 'HomeCtrl as ctrl'
                    }
                  },
                  resolve: {
                    printer: ['PrintService', '$q', 'Alert', function (PrintService, $q, Alert) {
                      if (PrintService.isConnected()) {
                        return $q.when(true);
                      } else {
                        PrintService.connect().then(function () {
                          PrintService.onPaperEnd(function () {
                            Alert.warning('Paper roll depleted');
                          });

                          PrintService.onPaperNearEnd(function () {
                            Alert.warning('Paper roll is about to be depleted');
                          });
                          console.log('printer connected');
                          return true;
                        }, function (ex) {
                          console.log('Cant connect to printer', ex);
                            // Alert.error("Unable to connect to the printer");
                            // return $q.resolve();
                        });
                      }
                      return $q.when(true);

                    }]
                  }
                })
                .state('app.sales', {
                  url: '/sales',
                  views: {
                    'menuContent': {
                      templateUrl: 'main/sales/sales.html',
                      controller: 'SalesCtrl',
                      controllerAs: 'SalesCtrl'
                    }
                  },
                  resolve: {
                    header: ['BillService', 'PrintService', function (BillService, PrintService) {
                      var rec_id = BillService.getCurrentReceiptId();
                      return BillService.getTempHeader(rec_id).then(function (header) {
                        if (!header) {
                          return BillService.initHeader().then(function (header) {
                            return header;
                          }, function (ex) {
                            console.log(ex);
                          });
                        } else {
                          return header;
                        }
                      }, function (ex) {
                        console.log(ex);
                      });
                    }],
                    user: ['AuthService', '$q', function (AuthService, $q) {
                      return AuthService.currentUser();
                    }],
                    shift: ['ShiftService', '$q', '$state', 'Alert', '$ionicLoading', function (ShiftService, $q, $state, Alert, $ionicLoading) {

                      var def = $q.defer();
                        // $timeout(function() {
                      var shift = ShiftService.getCurrent();
                      if (shift) {
                        def.resolve(shift);
                      } else {
                        Alert.warning('shift not set');
                        def.reject({redirectTo: 'app.shift'});
                            // def.reject();
                      }
                        // });
                      return def.promise.catch(function () { $state.go('app.shift'); $ionicLoading.hide(); });
                    }],
                    businessDate: ['ControlService', '$q', function (ControlService, $q) {
                      var def = $q.defer();
                      var bd = ControlService.getBusinessDate(true);
                      if (bd) {
                        def.resolve(bd);
                      } else {
                        console.log('business date not set');
                        return false;
                      }
                      return def.promise;
                    }],

                  }
                })

                .state('app.history', {
                  url: '/history',
                  views: {
                    'menuContent': {
                      templateUrl: 'main/history/history.html',
                      controller: 'HistoryCtrl'
                    }
                  }
                })

                // .state('app.printerSetup', {
                //     url: '/printer-setup',
                //     views: {
                //         'menuContent': {
                //             templateUrl: 'main/printerSetup/printerSetup.html',
                //             controller: 'PrinterSetupCtrl as ctrl'
                //         }
                //     }
                // })
              .state('app.shift', {
                url: '/shift',
                views: {
                  'menuContent': {
                    templateUrl: 'main/shift/shiftOptions.html',
                    controller: 'ShiftOptionsCtrl as ctrl'
                  }
                },
                resolve: {
                  shiftData: ['$q', 'ShiftService', function ($q, ShiftService) {
                    var def = $q.defer();
                    $q.all({
                      opened: ShiftService.getOpened(),
                      unOpened: ShiftService.getUnOpened(),
                      toBeDeclared: ShiftService.getDeclareCashShifts(),
                      dayEndPossible: ShiftService.dayEndPossible()
                    }).then(function (data) {
                      def.resolve(data);
                    }, function (ex) {
                      console.log(ex);
                      def.reject('error');
                    });
                    return def.promise;
                  }]
                }
              })
              .state('app.tender', {
                url: '/tender/{DocNo}',
                views: {
                  'menuContent': {
                    templateUrl: 'main/tender/tender.html',
                    controller: 'TenderCtrl as ctrl'
                  }
                },
                resolve: {
                  billData: ['$q', 'BillService', 'CartItemService', '$stateParams', 'ItemService', 'RoundingService', '$state', 'FunctionsService', 'TenderService',
                    function ($q, BillService, CartItemService, $stateParams, ItemService, RoundingService, $state, FunctionsService, TenderService) {
                      var docNo = $stateParams.DocNo;
                    //console.log(docNo);
                      var def = $q.defer();
                    // def.resolve({});
                      $q.all({
                        header: BillService.getTempHeader(docNo),
                        items: CartItemService.fetchItemsFromDb(docNo),
                        functions: FunctionsService.getTenderFunctions().then(function (fns) {
                          return {
                            top: _.where(fns, {DisplayOnTop: 'true'}),
                            bottom: _.where(fns, {DisplayOnTop: 'false'})
                          };
                        }),
                        tenderTypes: TenderService.getTenderTypes()
                      }).then(function (data) {
                        if (data && data.header) {
                          data.header = ItemService.calculateTotal(data.header);
                          data.header.TotalRounded = RoundingService.round(data.header.Total).toFixed(2) || 0 ;
                          data.header.UpdatedTenderTotal = data.header.Total.toFixed(2) || 0 ;
                          data.header.UpdatedRoundedTotal = RoundingService.round(data.header.Total).toFixed(2);
                          def.resolve(data);
                        } else {
                          def.reject('Bill not initialized');
                        }

                      }, function (ex) {
                        console.log(ex);
                        def.reject('error');
                      });
                      return def.promise.catch(function (ex) {
                        console.log(ex);
                        $state.go('app.sales');
                      });
                    }],
                  denominations: ['DenominationsService', function (DenominationsService) {
                    return DenominationsService.getAll();
                  }]
                }
              })
              .state('app.configsettings', {
                url: '/configsetting',
                views: {
                  'menuContent': {
                    templateUrl: 'main/logs/ConfigSetting.html',
                    controller: 'ConfigSettingCtrl as ctrl'
                  }
                }
              })

              .state('app.syncdetaillogs', {
                url: '/synclogs',
                views: {
                  'menuContent': {
                    templateUrl: 'main/logs/SyncLogsDetail.html',
                    controller: 'SyncLogsDetailCtrl as ctrl'
                  }
                }
              })

              .state('app.uploaddetaillogs', {
                url: '/uplogs',
                views: {
                  'menuContent': {
                    templateUrl: 'main/logs/UploadLogsDetail.html',
                    controller: 'UploadLogsDetailCtrl as ctrl'
                  }
                }
              })

              .state('app.shiftdetaillogs', {
                url: '/shiftlogs',
                views: {
                  'menuContent': {
                    templateUrl: 'main/logs/ShiftLogsDetail.html',
                    controller: 'ShiftLogsDetailCtrl as ctrl'
                  }
                }
              })

              .state('app.errordetaillogs', {
                url: '/errorlogs',
                views: {
                  'menuContent': {
                    templateUrl: 'main/logs/ErrorLogsDetail.html',
                    controller: 'ErrorLogsDetailCtrl as ctrl'
                  }
                }
              })

              .state('app.debugdetaillogs', {
                url: '/debuglogs',
                views: {
                  'menuContent': {
                    templateUrl: 'main/logs/DebugLogsDetail.html',
                    controller: 'DebugLogsDetailCtrl as ctrl'
                  }
                }
              })

              .state('app.admin', {
                url: '/admin',
                views: {
                  'menuContent': {
                    templateUrl: 'main/adminPanel/adminPanel.html',
                    controller: 'AdminPanelCtrl as ctrl'
                  }
                }
              });


            // .state('app.single', {
            //   url: '/playlists/:playlistId',
            //   views: {
            //     'menuContent': {
            //       templateUrl: 'build/templates/playlists/playlist.html',
            //       controller: 'PlaylistCtrl'
            //     }
            //   }
            // });
            // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/login');

            // catch exceptions in angular
        $provide.decorator('$exceptionHandler', ['$delegate', 'Logger', function ($delegate, Logger) {
          return function (exception, cause) {
            $delegate(exception, cause);

            console.log('e');
            Logger.error(exception, cause);
          };
        }]);
// catch exceptions out of angular
        window.onerror = function (message, url, line, col, error) {
          var stopPropagation = appConfig.debug ? false : true;
          var data = {
            type: 'javascript',
            url: window.location.hash,
            localtime: Date.now()
          };
          if (message) {
            data.message = message;
          }
          if (url) {
            data.fileName = url;
          }
          if (line) {
            data.lineNumber = line;
          }
          if (col) {
            data.columnNumber = col;
          }
          if (error) {
            if (error.name) {
              data.name = error.name;
            }
            if (error.stack) {
              data.stack = error.stack;
            }
          }

          if (appConfig.debug) {
            console.log('exception', data);
            window.alert('Error: ' + data.message);
          } else {
            track('exception', data);
          }
          return stopPropagation;
        };

        var BDate = new Date();
        var fYear = new Date();
        var tYear = new Date();
        fYear.setFullYear(BDate.getFullYear() - 3); // - 3 year from current year
        // console.log(fYear);
        tYear.setFullYear(BDate.getFullYear() + 3); // + 3 year from current year
        // console.log(fYear);
            //datepicker configuration
        var datePickerObj = {
          inputDate: new Date(),
          setLabel: 'Set',
          todayLabel: 'Today',
          closeLabel: 'Close',
          mondayFirst: false,
          weeksList: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
          monthsList: ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
          templateType: 'popup',
          from: fYear,
          to: tYear,
          showTodayButton: true,
          dateFormat: 'dd MMMM yyyy',
          closeOnSelect: false,
          disableWeekdays: []
        };
        ionicDatePickerProvider.configDatePicker(datePickerObj);

          // $peanuthubCustomKeyboardProvider.addCustomKeyboard('CUSTOM_SKU', {
          //   keys: [
          //     { type: "CHAR_KEY", value: "1" },
          //     { type: "CHAR_KEY", value: "2" },
          //     { type: "CHAR_KEY", value: "3" },
          //     { type: "CHAR_KEY", value: "4" },
          //     { type: "CHAR_KEY", value: "5" },
          //     { type: "CHAR_KEY", value: "6" },
          //     { type: "CHAR_KEY", value: "7" },
          //     { type: "CHAR_KEY", value: "8" },
          //     { type: "CHAR_KEY", value: "9" },
          //     { type: "CHAR_KEY", value: "0" },
          //     { type: "CHAR_KEY", value: "Q" },
          //     { type: "CHAR_KEY", value: "W" },
          //     { type: "CHAR_KEY", value: "E"},
          //     { type: "CHAR_KEY", value: "R"},
          //     { type: "CHAR_KEY", value: "T" },
          //     { type: "CHAR_KEY", value: "Y" },
          //     { type: "CHAR_KEY", value: "U" },
          //     { type: "CHAR_KEY", value: "I" },
          //     { type: "CHAR_KEY", value: "O" },
          //     { type: "CHAR_KEY", value: "P" },
          //     { type: "CHAR_KEY", value: "A" },
          //     { type: "CHAR_KEY", value: "S" },
          //     { type: "CHAR_KEY", value: "D" },
          //     { type: "CHAR_KEY", value: "F"},
          //     { type: "CHAR_KEY", value: "G" },
          //     { type: "CHAR_KEY", value: "H" },
          //     { type: "CHAR_KEY", value: "J" },
          //     { type: "CHAR_KEY", value: "K" },
          //     { type: "CHAR_KEY", value: "L" },
          //     { type: "CHAR_KEY", value: "" },
          //     { type: "CHAR_KEY", value: "." },
          //     { type: "CHAR_KEY", value: "Z" },
          //     { type: "CHAR_KEY", value: "X" },
          //     { type: "CHAR_KEY", value: "C" },
          //     { type: "CHAR_KEY", value: "V" },
          //     { type: "CHAR_KEY", value: "B" },
          //     { type: "CHAR_KEY", value: "N" },
          //     { type: "CHAR_KEY", value: "M" },
          //     { type: "CHAR_KEY", value: " ", label: "SPACE" },
          //     { type: "DELETE_KEY", icon: "ion-backspace-outline", label: 'DEL' }
          //   ]});
          // $peanuthubCustomKeyboardProvider.addCustomKeyboard('CUSTOM_SKU_NUM', {
          //   keys: [
          //     { type: "CHAR_KEY", value: "1" },
          //     { type: "CHAR_KEY", value: "2" },
          //     { type: "CHAR_KEY", value: "3" },
          //     { type: "CHAR_KEY", value: "4" },
          //     { type: "CHAR_KEY", value: "5" },
          //     { type: "CHAR_KEY", value: "6" },
          //     { type: "CHAR_KEY", value: "7" },
          //     { type: "CHAR_KEY", value: "8" },
          //     { type: "CHAR_KEY", value: "9" },
          //     { type: "CHAR_KEY", value: "0" },
          //     { type: "CHAR_KEY", value: "." },
          //     { type: "DELETE_KEY", icon: "ion-backspace-outline", label: 'DEL' }
          //   ]})
      }]);
angular.module('itouch.controllers', []);
angular.module('itouch.services', []);
angular.module('itouch.config', []);
angular.module('itouch.contants', []);
