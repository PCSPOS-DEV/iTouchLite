/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory("DiscountService", ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', 'LocationService', 'BillService', '$filter', 'ItemService', 'ControlService', 'RoundingService',
    function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG, LocationService, BillService, $filter, ItemService, ControlService, RoundingService) {
      var self = this;
      var tenderDiscounts = {
        header: null,
        items: [],
        discounts: []
      };

      var businessDate = $filter('date')(ControlService.getBusinessDate(), "yyyy-MM-dd");
      var DocNo = BillService.getCurrentReceiptId();
      var machineId = SettingsService.getMachineId();

      var location = LocationService.currentLocation;

      var getNextSeqNumber = function (itemId) {
        var discounts = _.pluck(tenderDiscounts.discounts, 'discount');
        var selectedDiscounts = [];
        var seqNumbers;
        var seqNumber;
        if(discounts.length > 0){
          selectedDiscounts = _.where(discounts, { ItemId: itemId});
          seqNumbers = _.pluck(selectedDiscounts, 'SeqNo');
          seqNumber = _.max(seqNumbers);
        }
        // console.log(seqNumber);
        if(seqNumber){
          return $q.when(++seqNumber);
        } else {
          return DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, 'MAX(SeqNo) AS sq', {columns: 'ItemId=?', data: [itemId]}).then(function (res) {
            var line = DB.fetch(res);
            if(line){
              return ++line.sq || 1;
            } else {
              return 1;
            }

          }, function (err) {
            console.log(err);
            return 1;
          });
        }
      }

      renameProperty(location, 'PriceLevel', 'PriceLevelId');
      renameProperty(location, 'Id', 'LocationId');
      if (!location) {
        LocationService.get().then(function (loc) {
          location = loc;
          renameProperty(location, 'PriceLevel', 'PriceLevelId');
          renameProperty(location, 'Id', 'LocationId');
        });
      }

      self.fetchDiscounts = function () {
        var deferred = $q.defer();
        try {
          Restangular.one("GetDiscountsByLocations").get({LocationId: SettingsService.getLocationId()}).then(function (res) {
            try {
              var items = JSON.parse(res);
              if (items) {
                self.saveDiscounts(items);

                // console.log('discounts');
                // console.log(items);
                deferred.resolve();
              } else {
                deferred.reject('Unknown machine');
              }
            } catch (ex) {
              deferred.reject("No results");
            }

          }, function (err) {
            console.error(err);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          deferred.reject(ex);
        }

        return deferred.promise;
      }

      self.saveDiscounts = function (items) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.discounts.discounts, items);
      }

      self.fetchDiscountsFor = function () {
        var deferred = $q.defer();
        try {
          Restangular.one("GetDiscountFor").get({LocationId: SettingsService.getLocationId()}).then(function (res) {
            try {
              var items = JSON.parse(res);
            } catch (ex) {
              deferred.reject("No results");
            }
            if (items) {
              self.saveDiscountsFor(items);
              deferred.resolve();
            } else {
              deferred.reject('Unknown machine');
            }
          }, function (err) {
            console.error(err);
            deferred.reject('Unable to fetch data from the server');
          });
        } catch (ex) {
          deferred.reject(ex);
        }

        return deferred.promise;
      }

      self.saveDiscountsFor = function (items) {
        DB.addInsertToQueue(DB_CONFIG.tableNames.discounts.discountsFor, items);
      }

      self.fetch = function () {
        return $q.all([self.fetchDiscounts(), self.fetchDiscountsFor()]);
      }

      self.get = function () {
        var q = "SELECT d.id as DiscountId, * FROM " + DB_CONFIG.tableNames.discounts.discounts + " AS d INNER JOIN "+DB_CONFIG.tableNames.discounts.discountsFor
        + " AS df ON d.DiscountFor = df.Id";
       return DB.query(q, []).then(function (result) {
         // console.log(DB.fetchAll(result));
         return DB.fetchAll(result);
        });
      }

      var checkValidity = function (item) {
        if(!item){
          return false;
        }
        if(item.NoDiscount){
          return false;
        }
        if(item.MultiDicount && item.DiscAmount > 0){
          return false;
        }
        return true;
      }

      self.getById = function (id) {
        var deferred = $q.defer();
        if (location) {
          var query = "SELECT i.Id, i.Description1, i.Description2, PriceGroupId, i.Plu, i.ZeroPrice, i.AutoBundle, i.BelowCost, PluType, Taxable, MultiDiscount, NoDiscount FROM Item AS i "
            + "INNER JOIN SubPLU1 AS s1 ON i.SubPlu1Id = s1.Id "
            + "INNER JOIN SubPLU2 AS s2 ON i.SubPlu2Id = s2.Id "
            + "INNER JOIN SubPLU3 AS s3 ON i.SubPlu3Id = s3.Id "
            + "WHERE i.Id = ?";
          DB.query(query, [id]).then(function (result) {
            var item = DB.fetch(result);
            self.getPrice(item.Plu, item.PriceGroupId).then(function (data) {
              item.Price = data ? data.Price : 0;
              item.PriceLevelId = data ? data.PriceLevelId : 0;
              deferred.resolve(item);
            }, function (err) {
              throw new Error(err.message);
              deferred.reject(err.message);
            });
          }, function (err) {
            throw new Error(err.message);
            deferred.reject(err.message);
          });
        } else {
          throw new Error("Invalid location");
          deferred.reject("Invalid location");
        }
        return deferred.promise;
      }

      self.getDiscountById = function (id) {
        var q = "SELECT * FROM " + DB_CONFIG.tableNames.discounts.discounts + " AS d INNER JOIN "+DB_CONFIG.tableNames.discounts.discountsFor
          + " AS df ON d.DiscountFor = df.Id WHERE d.Id = ?";
        return DB.query(q, [id]).then(function (result) {
          return DB.fetch(result);
        });
      }

      var saveItemDiscount = function (item) {
        var reqFields = ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'LineNumber', 'SeqNo', 'DiscountFrom',
          'DiscountId', 'DiscountCode', 'DiscountFor', 'DiscountType', 'DiscountAmount', 'DiscountPercentage'] ;
        var errors = [];
        angular.forEach(reqFields, function (attribute) {
          if(_.isUndefined(item[attribute])){
            errors.push("Field "+attribute+" cannot be empty");
          }
        });

        if(errors.length == 0){
          DB.addInsertToQueue(DB_CONFIG.tableNames.discounts.tempBillDiscounts, item);
          return true;
        } else {
          console.log(errors);
          return false;
        }
      }

      var addDiscountAmount = function (subTotal, presentage) {
        return ((subTotal * presentage) / 100).roundTo(2);
      }

      var removeDiscountAmount = function (subTotal, presentage) {
        return ((subTotal * 100) / presentage).roundTo(2);
      }

      var updateTempBillDetail = function (item) {
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.tempDetail, _.pick(item, 'SubTotal', 'DiscAmount', 'Tax5DiscAmount'), {columns:'ItemId=? AND LineNumber=?', data: [item.ItemId, item.LineNumber]});
      }

      var updateTempBillHeader = function (DocNo, item) {
        var def = $q.defer();
        BillService.getHeader(DocNo).then(function(header){
          if(header){
            header.DiscAmount += item.DiscAmount;
            header.Tax1DiscAmount += item.Tax1DiscAmount;
            header.Tax2DiscAmount += item.Tax2DiscAmount;
            header.Tax3DiscAmount += item.Tax3DiscAmount;
            header.Tax4DiscAmount += item.Tax4DiscAmount;
            header.Tax5DiscAmount += item.Tax5DiscAmount;
            updateTempHeader(header);
            def.resolve();
          } else {
            def.reject("header not found");
          }
        }, function(ex){
          def.reject(ex);
        });
        return def.promise;
      }

      var updateTempHeader = function (header) {
        DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.tempHeader, _.pick(header, 'SubTotal', 'DiscAmount', 'Tax5DiscAmount'), {columns:'DocNo=?', data: [header.DocNo]});
      }


      // var total = null;
      var calculateDiscountAmounts = function (item, discount, amount) {
        // if(total == null){
        //   total = 0;
        // }
        var totalDiscount = 0, subDiscount = 0;
        // if(discount.DiscountType == 1){
          if(item.DiscPrec || discount.DiscountType == 2){
            if(item.DiscPrec){
              discount.Percentage = item.DiscPrec;
            }
            item = ItemService.calculateTotal(item);
            totalDiscount = addDiscountAmount(item.Total, discount.Percentage || discount.DiscountPercentage).roundTo(2);
            subDiscount = addDiscountAmount((item.SubTotal - item.DiscAmount), discount.Percentage || discount.DiscountPercentage).roundTo(2);
            delete item.DiscPrec;
          } else {
            // totalDiscount  = (item.Total < discount.Amount ? item.Total : discount.Amount).roundTo(2);
            // subDiscount = ((totalDiscount * (100-item.Tax5Perc)) / 100).roundTo(2);

            totalDiscount = amount ? parseFloat(amount) : discount.Amount;
            subDiscount = ((totalDiscount * (100-item.Tax5Perc)) / 100).roundTo(2);
          }


        // } else {
        //   discount.Percentage = parseFloat(discount.Percentage || discount.DiscountPercentage);
        //   totalDiscount = addDiscountAmount(item.Total, discount.Percentage);
        //   subDiscount = addDiscountAmount((item.SubTotal - item.DiscAmount), discount.Percentage);
        // }
        totalDiscount = totalDiscount.roundTo(2);
        item.Discount += totalDiscount;
        item.DiscAmount += subDiscount;
        item.Tax5DiscAmount += (totalDiscount - subDiscount).roundTo(2);
        discount.DiscountAmount = totalDiscount;
        // total = (total + totalDiscount).roundTo(2);
        // console.log(totalDiscount);
        // console.log(item);
        return  {item: angular.copy(item), discount: angular.copy(discount)};
      }

      // var processItem = function (item, discount, customDiscountAmount) {
      //
      //     item = ItemService.calculateTotal(item);
      //     calculateDiscountAmounts(item, discount, customDiscountAmount);
      //     discount.DiscountAmount = item.Discount;
      //
      //     renameProperty(discount, 'Id', 'DiscountId');
      //     renameProperty(discount, 'Percentage', 'DiscountPercentage');
      //     renameProperty(discount, 'Code', 'DiscountCode');
      //     discount = _.pick(discount, ['DiscountFrom', 'DiscountId', 'DiscountCode', 'DiscountFor', 'DiscountType', 'DiscountPercentage', 'DiscountAmount']);
      //     discount = _.extend(_.pick(item, ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'LineNumber']),discount);
      //     discount.SeqNo = sn;
      //     discount.DiscountFrom = 'I';
      //     discount.DocNo =  discount.DocNo || DocNo;
      //     discount.BusinessDate =  discount.BusinessDate || businessDate;
      //     discount.MachineId =  discount.MachineId || machineId;
      //     discount.LocationId =  discount.LocationId || location.LocationId;
      //
      //     return true;
      // }

      var processDiscountItem = function (item, discount) {
        return getNextSeqNumber(item.ItemId).then(function (sn) {
          // renameProperty(discount, 'Id', 'DiscountId');
          renameProperty(discount, 'Percentage', 'DiscountPercentage');
          renameProperty(discount, 'Code', 'DiscountCode');
          console.log(discount);
          discount = _.pick(discount, ['DiscountFrom', 'DiscountId', 'DiscountCode', 'DiscountFor', 'DiscountType', 'DiscountPercentage', 'DiscountAmount']);
          discount = _.extend(_.pick(item, ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'LineNumber']),discount);
          discount.SeqNo = sn;
          discount.DiscountFrom = 'I';
          discount.DocNo =  discount.DocNo || DocNo;
          discount.BusinessDate =  discount.BusinessDate || businessDate;
          discount.MachineId =  discount.MachineId || machineId;
          discount.LocationId =  discount.LocationId || location.LocationId;

          return discount;
        });
      }

      var processTendderDiscountItem = function (item, discount) {
        var data = { item: null, discount: null };
        return getNextSeqNumber(item.ItemId).then(function (sn) {
          // renameProperty(discount, 'Id', 'DiscountId');
          renameProperty(discount, 'Percentage', 'DiscountPercentage');
          renameProperty(discount, 'Code', 'DiscountCode');
          // console.log(discount);
          discount = _.pick(discount, ['DiscountFrom', 'DiscountId', 'DiscountCode', 'DiscountFor', 'DiscountType', 'DiscountPercentage', 'DiscountAmount']);
          discount = _.extend(_.pick(item, ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'LineNumber']),discount);
          discount.SeqNo = sn;
          discount.DiscountFrom = 'T';
          discount.DocNo =  discount.DocNo || DocNo;
          discount.BusinessDate =  discount.BusinessDate || businessDate;
          discount.MachineId =  discount.MachineId || machineId;
          discount.LocationId =  discount.LocationId || location.LocationId;

          data.item = item;
          data.discount = discount;

          return data;
        });
      }

      self.saveTempDiscountItem = function (item, discount, amount) {
        DB.clearQueue();
        ItemService.calculateTotal(item);
        var discountAmounts = calculateDiscountAmounts(item, discount, amount);
        item = discountAmounts.item;
        discount = discountAmounts.discount;
        if(checkAmountEligibility(item)){
          return processDiscountItem(item, discount).then(function (discount) {
            // console.log(item);
            // console.log(discount);
            saveItemDiscount(discount);
            updateTempBillDetail(item, { columns: 'DocNo=? AND ItemId=? AND LineNumber=?', data: [item.DocNo, item.ItemId, item.LineNumber]});
            return updateTempBillHeader(item.DocNo, _.pick(item, ['DiscAmount', 'Tax1DiscAmount', 'Tax2DiscAmount', 'Tax3DiscAmount', 'Tax4DiscAmount', 'Tax5DiscAmount'])).then(function(){
              return DB.executeQueue().then(function () {
                return item;
              }, function(ex){
                console.log(ex);
              });
            });


          });
        } else {
          return $q.reject("Not eligible for this discount amount");
        }

      }

      self.checkItemEligibility = function (item) {
        if(item.NoDiscount == "true"){
          return false;
        }
        if(item.DiscAmount > 0){
          if(item.MultiDiscount == "false"){
            return false;
          }
        }
        return true;
      }

      var checkAmountEligibility = function(item){
        // console.log(item);
        if(item.BelowCost == 'false'){
          return (item.Total-item.Discount) >= item.StdCost;
        }
        return false;
      }

      var calculateTenderDiscountAmounts = function(items, amount){


      }

      self.prepareTenderDiscount = function (header, items, discount, amount) {
        var deferred = $q.defer();
        var discountSet;

        var discountValues = {
          Discount: 0,
          DiscAmount: 0,
          Tax5DiscAmount: 0
        };


        var queue  = [];

        var total = header.TenderTotal || header.Total;

        var discountAmounts = null;
        if(!amount){
          amount = discount.Percentage ? (total * discount.Percentage || discount.DiscountPercentage) / 100 : parseFloat(discount.Amount);
        } else {
          amount = parseFloat(discount.Amount);
        }

        // amount = parseFloat(amount);
        var headerDiscount = 0, headerSubDiscount = 0, totalEligibleDiscount = 0, headerTax5Disc = 0;
        var prec = 0;
        angular.forEach(items, function (item, key) {
          // totalDiscount  = (item.Total < discountPerItem ? item.Total : discount.Amount).roundTo(2);
          // subDiscount = ((totalDiscount * (100-item.Tax5Perc)) / 100).roundTo(2);
          item = ItemService.calculateTotal(item);
          if(!self.checkItemEligibility(item)){
            item.TotalEligibleDiscount = 0;
          } else if(item.BelowCost == 'true' || item.StdCost == 0){
            item.TotalEligibleDiscount  = item.Total;
          } else {
            item.TotalEligibleDiscount = (item.StdCost * item.Qty) - item.Discount;
          }

          totalEligibleDiscount += item.TotalEligibleDiscount;
        });
        if(amount > totalEligibleDiscount){
          return false;
        } else {
          angular.forEach(_.values(items), function (item, key) {
            prec = item.TotalEligibleDiscount / totalEligibleDiscount;
            var discountAmount = 0;
            if(key != _.size(items) - 1){
              discountAmount = (amount * prec).roundTo(2);
            } else {
              discountAmount = (amount - headerDiscount).roundTo(2);
            }
            var subDiscount = ((discountAmount * (100-item.Tax5Perc)) / 100).roundTo(2);
            var tax5Disc = (discountAmount - subDiscount).roundTo(2);

            item.Discount += discountAmount;
            discount.DiscountAmount = angular.copy(discountAmount);
            item.DiscAmount = subDiscount;
            item.Tax5DiscAmount = tax5Disc;

            headerDiscount += discountAmount;
            headerSubDiscount += subDiscount;
            headerTax5Disc += tax5Disc;



            queue.push(processTendderDiscountItem(item, angular.copy(discount)));
          });

          return $q.all(queue).then(function(items){

            header.Discount += headerDiscount;
            header.DiscAmount += headerSubDiscount;
            header.Tax5DiscAmount += headerTax5Disc;
            header = ItemService.calculateTotal(header);

            header.TenderTotal = header.Total.roundTo(2);

            header.UpdatedTenderTotal = header.Total.toFixed(2);
            header.UpdatedRoundedTotal = RoundingService.round(header.Total).toFixed(2);
            header.TotalRounded = RoundingService.round(header.Total).toFixed(2);
            tenderDiscounts.header = header;
            tenderDiscounts.discounts = _.pluck(items, 'discount');
            tenderDiscounts.items = _.pluck(items, 'item');
            console.log(tenderDiscounts);
          }, function(ex){
            return ex;
            console.log(ex);
          });
        }


        return deferred.promise;

      };

      self.saveTenderDiscount = function (DocNo) {
        // var deferred = $q.defer();
        // console.log(tenderDiscounts);
        if(!_.isEmpty(tenderDiscounts) && !_.isEmpty(tenderDiscounts.header) && tenderDiscounts.discounts.length > 0 && tenderDiscounts.items.length > 0){
          DB.clearQueue();

          angular.forEach(tenderDiscounts.items, function(item){
            // console.log(item);
            updateTempBillDetail(item);

          });

          angular.forEach(tenderDiscounts.discounts, function(item){
            // console.log(item);
            saveItemDiscount(item);
          });

          // updateTempHeader(tenderDiscounts.header);

          return DB.executeQueue().then(function () {
            tenderDiscounts.items = [];
            tenderDiscounts.discounts = [];
            DB.clearQueue();
            return BillService.updateHeaderTotals(tenderDiscounts.header.DocNo)
          }, function(ex){
            return ex;
            console.log(ex);
          });

        } else {
          return $q.resolve();
        }

      }

      return self;
    }]);
