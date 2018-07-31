/**
 * Created by shalitha on 19/5/16.
 */
angular.module('itouch.services')

  .service('SyncService', ['$q', 'AuthService', 'KeyBoardService', 'Alert', 'DB', 'ItemService', 'SubPLU1Service', 'LogService',
    'SubPLU2Service', 'SubPLU3Service', 'PriceGroupService', 'LocationService', 'FileService', 'TenderService',
    'FunctionsService', 'SalesKitService', 'DaysService', 'ShiftService', 'DiscountService', 'ReasonService', 'PrinterSettings',
    'PWPService', 'ModifierService', 'DepartmentService', 'SettingsService', 'BillService', 'DenominationsService', 'ImageDownloadService', 'Restangular', 'AppConfig',
    function ($q, AuthService, KeyBoardService, Alert, DB, ItemService, SubPLU1Service, LogService, SubPLU2Service, SubPLU3Service,
              PriceGroupService, LocationService, FileService, TenderService, FunctionsService, SalesKitService, DaysService,
              ShiftService, DiscountService, ReasonService, PrinterSettings, PWPService, ModifierService, DepartmentService, SettingsService, BillService, DenominationsService, ImageDownloadService, Restangular, AppConfig) {
      var self = this;
      syncLog = SettingsService.StartSyncLog();
      eventLog = LogService.StartEventLog();
      errorLog = LogService.StartErrorLog();
      self.do = function () {
        Alert.showLoading();
        var url = AppConfig.getBaseUrl();
        if (url) {
          syncLog.log('Sync Url : ' + url, 1);
          return checkStatus().then(function () {
            DB.clearQueue();
            DB.createTables();
            return DB.executeQueue().then(function () {
              syncLog.log('--*-- Sync Detail Initialized --*--', 7);
              eventLog.log('--*-- Sync Detail Initialized --*--');
              return $q.all({
                'Users': AuthService.fetchUsers(),
                'Layouts': KeyBoardService.fetchLayout(),
                'Keys': KeyBoardService.fetchKeys(),
                'Pages': KeyBoardService.fetchPages(),
                'Items': ItemService.fetch(),
                'SubPLU1': SubPLU1Service.fetch(),
                'SubPLU2': SubPLU2Service.fetch(),
                'SubPLU3': SubPLU3Service.fetch(),
                'PriceGroups': PriceGroupService.fetch(),
                'Locations': LocationService.fetch(),
                'TenderTypes': TenderService.fetchTenderTypes(),
                'Functions': FunctionsService.fetch(),
                'SalesKits': SalesKitService.fetch(),
                'PromotionDays': DaysService.fetch(),
                'Shifts': ShiftService.fetch(),
                'Discounts': DiscountService.fetch(),
                'Reasons': ReasonService.fetch(),
                'PrinterSettings': PrinterSettings.fetch(),
                'ItemsByPWP': PWPService.fetchItemsByPWP(),
                'PWP': PWPService.fetchPWP(),
                'Departments': DepartmentService.fetch(),
                'Modifiers': ModifierService.fetch(),
                'Machines': SettingsService.fetchMachines(),
              // 'Images': ImageDownloadService.downloadImages()

              })
            // FunctionsService.fetch()
              .then(function (values) {
                return DB.executeQueue().then(function () {
                  syncLog.log('--*-- Sync Detail Completed --*--', 7);
                  eventLog.log('--*-- Sync Detail Completed --*--');
                  DenominationsService.addDefault();
                  LocationService.get();
                  return ImageDownloadService.downloadImages().then(function () {
                    console.log('sync done');
                    syncLog.log('Sync Complete', 1);
                    syncLog.log('-----*-----*-----', 7);
                    var syncLogs = localStorage.getItem('SyncLogs');
                    localStorage.removeItem('SyncLogs');
                    var logs = syncLog.getLog();
                    if (syncLogs == null) {
                      syncLogs = '';
                    }
                    localStorage.setItem('SyncLogs', syncLogs + logs);
                    // var logs = syncLog.getLog();
                    // console.log(logs);
                  }, function (ex) {
                    console.log('sync error', ex);
                    syncLog.log('Sync Error : ' + ex, 4);
                    errorLog.log('Sync Error : ' + ex);
                    syncLog.log('Sync Complete', 1);
                    syncLog.log('-----*-----*-----', 7);
                    var syncLogs = localStorage.getItem('SyncLogs');
                    localStorage.removeItem('SyncLogs');
                    var logs = syncLog.getLog();
                    if (syncLogs == null) {
                      syncLogs = '';
                    }
                    localStorage.setItem('SyncLogs', syncLogs + logs);
                    // var logs = syncLog.getLog();
                    // console.log(logs);
                    Alert.error(ex);
                  }).finally(function () {
                    Alert.hideLoading();
                  });
                }, function (err) {
                  errorLog.log('Sync Error : ' + err);
                  Alert.hideLoading();
                });
              });

            }, function (ex) {
              errorLog.log('Sync Error : ' + ex);
              syncLog.log('Sync Error : Unable to connect to Server', 4);
              Alert.error('Unable to connect to Server');
            });
          }, function (err) {
            errorLog.log('Sync Error : ' + err);
            Alert.hideLoading();
            console.log(err);
            errorLog.log('Sync Error : Unable to connect to Server');
            syncLog.log('Sync Error : Unable to connect to Server', 4);
            Alert.error('Unable to connect to Server');
          });
        } else {
          errorLog.log('Sync Fail : Base URL not configured', 4);
          syncLog.log('Sync Fail : Base URL not configured', 4);
          Alert.error('Base URL not configured');
        }

      // self.upload();
      };

      self.upload = function () {
        return $q.all({
          headers: BillService.getAllHeaders(),
          details: BillService.getAllDetails(),
          transactions: BillService.getAllTransactions(),
          transactionsOT: BillService.getAllTransactionsOT()
        }).then(function (res) {
          res.headers = _.map(res.headers, function (item) {
            item.BusinessDate = moment(item.BusinessDate).format('MM/DD/YYYY');
            item.SysDateTime = moment(item.SysDateTime).format('MM/DD/YYYY HH:mm:ss');
          // console.log(item);
            return item;
          });
          res.details = _.map(res.details, function (item) {
            item.BusinessDate = moment(item.BusinessDate).format('MM/DD/YYYY');
            item.SysDateTime = moment(item.SysDateTime).format('MM/DD/YYYY HH:mm:ss');
          // console.log(item);
            return item;
          });
          res.transactions = _.map(res.transactions, function (item) {
            item.BusinessDate = moment(item.BusinessDate).format('MM/DD/YYYY');
          // console.log(item);
            return item;
          });
          res.transactionsOT = _.map(res.transactionsOT, function (item) {
            item.BusinessDate = moment(item.BusinessDate).format('MM/DD/YYYY');
            console.log(item);
            return item;
          });
          var data = {
            headers: JSON.stringify(res.headers),
            details: JSON.stringify(res.details),
            transactions: JSON.stringify(res.transactions),
            transactionsOT: JSON.stringify(res.transactionsOT)
          };
          return Restangular.one('Upload').post(data);

        }, function (error) {
          console.log(error);
        });
      };

      var checkStatus = function (url) {
        url = AppConfig.getBaseUrl();
        if (url) {
          return Restangular.oneUrl('checkStatus', url + 'test').withHttpConfig({timeout: 3000}).get().then(function (res) {
            if (res == 'true' || res == true) {
              syncLog.log('Sync Check Status : Start Sync', 1);
              return true;
            } else {
              syncLog.log('Sync Fail : Invalid service', 1);
              errorLog.log('Sync Fail : Invalid service');
              return $q.reject('Invalid service');
            }
          }, function (err) {
            console.log(err);
            syncLog.log('Sync Error : ' + err.statusText, 1);
            errorLog.log('Sync Error : ' + err.statusText);
            return $q.reject(err.statusText);
          });
        } else {
          syncLog.log('Sync Fail : Base URL not configured', 1);
          errorLog.log('Sync Fail : Base URL not configured');
          return $q.reject('Base URL not configured');
        }
      };
    }]);
