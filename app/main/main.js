
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
      PrintService.setIPAddress('192.168.1.205');
      PrintService.setPort('8008');
      PrintService.connect('192.168.1.205', '8008').then(function(){
        // Alert.success('Success');
        PrintService.onOffline(function(){
          Alert.success('Printer connected', 'Connected');
        });

        PrintService.onRecieve(function(){
          Alert.success('Printer offline', 'offline');
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
                            controller: 'SalesCtrl'
                        }
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
