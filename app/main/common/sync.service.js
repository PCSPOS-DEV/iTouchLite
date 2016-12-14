/**
 * Created by shalitha on 19/5/16.
 */
angular.module('itouch.services')

  .service("SyncService", ['$q', 'AuthService', 'KeyBoardService', 'Alert', 'DB', 'ItemService', 'SubPLU1Service',
    'SubPLU2Service', 'SubPLU3Service', 'PriceGroupService', 'LocationService', 'FileService', 'TenderService',
    'FunctionsService', 'SalesKitService', 'DaysService', 'ShiftService', 'DiscountService', 'ReasonService', 'PrinterSettings',
    'PWPService', 'ModifierService', 'DepartmentService',
    function ($q, AuthService, KeyBoardService, Alert, DB, ItemService, SubPLU1Service, SubPLU2Service, SubPLU3Service,
              PriceGroupService, LocationService, FileService, TenderService, FunctionsService, SalesKitService, DaysService,
              ShiftService, DiscountService, ReasonService, PrinterSettings, PWPService, ModifierService, DepartmentService) {
    this.do = function () {
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
          // 'Images': FileService.fetch()
        })
        // FunctionsService.fetch()
          .then(function (values) {
          return DB.executeQueue().then(function () {
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


    }
  }]);
