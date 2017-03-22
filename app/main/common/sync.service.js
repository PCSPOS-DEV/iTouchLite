/**
 * Created by shalitha on 19/5/16.
 */
angular.module('itouch.services')

  .service("SyncService", ['$q', 'AuthService', 'KeyBoardService', 'Alert', 'DB', 'ItemService', 'SubPLU1Service',
    'SubPLU2Service', 'SubPLU3Service', 'PriceGroupService', 'LocationService', 'FileService', 'TenderService',
    'FunctionsService', 'SalesKitService', 'DaysService', 'ShiftService', 'DiscountService', 'ReasonService', 'PrinterSettings',
    'PWPService', 'ModifierService', 'DepartmentService', 'SettingsService', 'BillService', 'DenominationsService', 'ImageDownloadService',
    function ($q, AuthService, KeyBoardService, Alert, DB, ItemService, SubPLU1Service, SubPLU2Service, SubPLU3Service,
              PriceGroupService, LocationService, FileService, TenderService, FunctionsService, SalesKitService, DaysService,
              ShiftService, DiscountService, ReasonService, PrinterSettings, PWPService, ModifierService, DepartmentService, SettingsService, BillService, DenominationsService, ImageDownloadService) {
    var self = this;
    self.do = function () {
      Alert.showLoading();
      DB.clearQueue();
      DB.createTables();
      return DB.executeQueue().then(function () {
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
            ImageDownloadService.downloadImages();
            DenominationsService.addDefault();
            LocationService.get();
            console.log('sync done');
            Alert.hideLoading();

            return true;
          }, function (err) {
            Alert.hideLoading();
            console.error(err);
          });
        }, function (err) {
          Alert.hideLoading();
          console.log(err);
        });
      });
      // self.upload();
    }

    self.upload = function(){
      return $q.all({
        headers: BillService.getAllHeaders(),
        details: BillService.getAllDetails(),
        transactions: BillService.getAllTransactions(),
        transactionsOT: BillService.getAllTransactionsOT()
      }).then(function(res){
        res.headers = _.map(res.headers, function(item){
          item.BusinessDate = moment(item.BusinessDate).format('MM/DD/YYYY');
          item.SysDateTime = moment(item.SysDateTime).format('MM/DD/YYYY HH:mm:ss');
          // console.log(item);
          return item;
        });
        res.details = _.map(res.details, function(item){
          item.BusinessDate = moment(item.BusinessDate).format('MM/DD/YYYY');
          item.SysDateTime = moment(item.SysDateTime).format('MM/DD/YYYY HH:mm:ss');
          // console.log(item);
          return item;
        });
        res.transactions = _.map(res.transactions, function(item){
          item.BusinessDate = moment(item.BusinessDate).format('MM/DD/YYYY');
          // console.log(item);
          return item;
        });
        res.transactionsOT = _.map(res.transactionsOT, function(item){
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
        return Restangular.one("Upload").post(data);

      }, function(error){
        console.log(error);
      });
    }
  }]);
