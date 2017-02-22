
angular.module('itouch', [
    'ionic',
    'ngCordova',
    'ui.router',
    'ngStorage',
    'restangular',
    'ngOrderObjectBy',
    'ionic-datepicker',
    'angularMoment',
    'itouch.logger',
    'itouch.config',
    'itouch.controllers',
    'itouch.services'
    // TODO: load other modules selected during generation
])
    .run(['$ionicPlatform', 'DB', 'PrintService', 'Alert', function ($ionicPlatform, DB, PrintService, Alert) {
      PrintService.setIPAddress('192.168.1.204');
      PrintService.setPort('8008');
      PrintService.connect('192.168.1.205', '8008').then(function(){
        // Alert.success('Success');
        PrintService.onOffline(function(){
          Alert.success('Printer offline', 'offline');
        });

        PrintService.onRecieve(function(){
          // Alert.success('Printer offline', 'offline');
        });
      }, function(err){
        Alert.success(err, 'Error');
      });
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


        });
    }])

    .config(['$stateProvider', '$urlRouterProvider', 'RestangularProvider', '$provide', 'ionicDatePickerProvider', 'APP_CONFIG',
        function ($stateProvider, $urlRouterProvider, RestangularProvider, $provide, ionicDatePickerProvider, APP_CONFIG) {

            RestangularProvider.setBaseUrl('http://pcsdevserver.prima.local:89/PCSiSyncServices/PCSPOSiSysnService.svc/');

            $stateProvider
                .state('login', {
                    url: '/login',
                    templateUrl: 'main/login/login.html',
                    controller: 'LoginCtrl'
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
                      header: ['BillService', function(BillService){
                        var rec_id = BillService.getCurrentReceiptId();
                        return BillService.getHeader(rec_id).then(function(header){
                          if(!header){
                            return BillService.initHeader().then(function(header){
                              return header;
                            });
                          } else{
                            return header;
                          }
                        });
                      }],
                      user: ['AuthService', '$q', function(AuthService, $q){
                        return AuthService.currentUser();
                      }],
                      shift: ['ShiftService', '$q', '$state', '$timeout', function(ShiftService, $q, $state, $timeout){

                        var def = $q.defer();
                        // $timeout(function() {
                          var shift = ShiftService.getCurrent();
                          if (shift) {
                            def.resolve(shift);
                          } else {
                            console.log('shift not set');
                            // def.reject({redirectTo: 'app.shift'});
                            def.reject();
                          }
                        // });
                        return def.promise.catch(function () { $state.go('app.shift'); });;
                      }],
                      businessDate: ['ControlService', '$q', function(ControlService, $q){
                        var def = $q.defer();
                        var bd = ControlService.getBusinessDate(true);
                        if(bd){
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
                .state('app.printerSetup', {
                    url: '/printer-setup',
                    views: {
                        'menuContent': {
                            templateUrl: 'main/printerSetup/printerSetup.html',
                            controller: 'PrinterSetupCtrl as ctrl'
                        }
                    }
                })
              .state('app.shift', {
                url: '/shift',
                views: {
                  'menuContent': {
                    templateUrl: 'main/shift/shiftOptions.html',
                    controller: 'ShiftOptionsCtrl as ctrl'
                  }
                },
                resolve: {
                  shiftData: ['$q', 'ShiftService', function($q, ShiftService){
                    var def = $q.defer();
                    $q.all({
                      opened: ShiftService.getOpened(),
                      unOpened: ShiftService.getUnOpened(),
                      toBeDeclared: ShiftService.getDeclareCashShifts(),
                      dayEndPossible: ShiftService.dayEndPossible()
                    }).then(function(data){
                      def.resolve(data);
                    }, function(ex){
                      console.log(ex);
                      def.reject("error");
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
                    function($q, BillService, CartItemService, $stateParams, ItemService, RoundingService, $state, FunctionsService, TenderService){
                    var docNo = $stateParams.DocNo;
                    console.log(docNo);
                    var def = $q.defer();
                    // def.resolve({});
                    $q.all({
                      header: BillService.getHeader(docNo),
                      items: CartItemService.fetchItemsFromDb(docNo),
                      functions: FunctionsService.getTenderFunctions().then(function (fns) {
                        return {
                          top: _.where(fns, {DisplayOnTop: "true"}),
                          bottom: _.where(fns, {DisplayOnTop: "false"})
                        }
                      }),
                      tenderTypes: TenderService.getTenderTypes()
                    }).then(function(data){
                      if(data && data.header){
                        data.header = ItemService.calculateTotal(data.header);
                        data.header.TotalRounded = RoundingService.round(data.header.Total).toFixed(2) || 0 ;
                        data.header.UpdatedTenderTotal = data.header.Total.toFixed(2) || 0 ;
                        data.header.UpdatedRoundedTotal = RoundingService.round(data.header.Total).toFixed(2);
                        def.resolve(data);
                      } else {
                        def.reject("Bill not initialized");
                      }

                    }, function(ex){
                      console.log(ex);
                      def.reject("error");
                    });
                    return def.promise.catch(function(ex){
                      console.log(ex);
                      $state.go('app.sales');
                    });
                  }]
                }
              })


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

                    console.log("e");
                    Logger.error(exception, cause);
                };
            }]);
// catch exceptions out of angular
            window.onerror = function (message, url, line, col, error) {
                var stopPropagation = APP_CONFIG.debug ? false : true;
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

                if (APP_CONFIG.debug) {
                    console.log('exception', data);
                    window.alert('Error: ' + data.message);
                } else {
                    track('exception', data);
                }
                return stopPropagation;
            };

            //datepicker configuration
            var datePickerObj = {
                inputDate: new Date(),
                setLabel: 'Set',
                todayLabel: 'Today',
                closeLabel: 'Close',
                mondayFirst: false,
                weeksList: ["S", "M", "T", "W", "T", "F", "S"],
                monthsList: ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
                templateType: 'popup',
                from: new Date(2012, 8, 1),
                to: new Date(2018, 8, 1),
                showTodayButton: true,
                dateFormat: 'dd MMMM yyyy',
                closeOnSelect: false,
                disableWeekdays: [6]
            };
            ionicDatePickerProvider.configDatePicker(datePickerObj);
        }]);
angular.module("itouch.controllers", []);
angular.module("itouch.services", []);
angular.module('itouch.config', []);
angular.module('itouch.contants', []);
