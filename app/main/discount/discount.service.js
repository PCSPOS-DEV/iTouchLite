/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory("DiscountService", ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', 'LocationService', 'BillService', '$filter', 'ItemService', 'ControlService', 'RoundingService',
    function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG, LocationService, BillService, $filter, ItemService, ControlService, RoundingService) {
      var self = this;
      var tenderDiscounts = {
        header: null,
        items: {},
        discounts: []
      };

      var businessDate = ControlService.getBusinessDate(true);
      var DocNo = BillService.getCurrentReceiptId();
      var machineId = SettingsService.getMachineId();

      var location = LocationService.currentLocation;

      var getNextSeqNumber = function (DocNo, ItemId) {
        return DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, 'MAX(SeqNo) AS sq', {columns: 'DocNo=? AND ItemId=?', data: [DocNo, ItemId]}).then(function (res) {
          var line = DB.fetch(res);
          if(line){
            return ++line.sq;
          } else {
            return 1;
          }
        }, function (err) {
          return 1;
        });

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
          var discount = DB.fetch(result);
          renameProperty(discount, 'Id', 'DiscountId');
          return discount;
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


      // var total = null;
      var calculateDiscountAmounts = function (item, discount) {
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

            totalDiscount = discount.Amount;
            subDiscount = ((totalDiscount * (100-item.Tax5Perc)) / 100).roundTo(2);
          }

        totalDiscount = totalDiscount.roundTo(2);
        item.Discount = (item.Discount + totalDiscount).roundTo(2);
        item.DiscAmount = (item.DiscAmount + subDiscount).roundTo(2);
        item.Tax5DiscAmount = (item.Tax5DiscAmount +(totalDiscount - subDiscount)).roundTo(2);
        discount.DiscountAmount = totalDiscount;

        return  {item: angular.copy(item), discount: angular.copy(discount)};
      }

      var processDiscountItem = function (item, discount) {
        return getNextSeqNumber(item.DocNo, item.ItemId).then(function (sn) {
          // renameProperty(discount, 'Id', 'DiscountId');
          renameProperty(discount, 'Percentage', 'DiscountPercentage');
          renameProperty(discount, 'Code', 'DiscountCode');
          if(!discount.DiscountAmount){
            renameProperty(discount, 'Amount', 'DiscountAmount');
          }
          discount = _.pick(discount, ['DiscountFrom', 'DiscountId', 'DiscountCode', 'DiscountFor', 'DiscountType', 'DiscountPercentage', 'DiscountAmount', 'SeqNo']);
          discount = _.extend(_.pick(item, ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'LineNumber']),discount);
          discount.SeqNo = sn;
          discount.DiscountFrom = 'I';
          discount.DiscountType = ""+parseInt(discount.DiscountType );
          discount.DocNo =  discount.DocNo || BillService.getCurrentReceiptId();
          discount.BusinessDate =  discount.BusinessDate || ControlService.getBusinessDate(true);
          discount.MachineId =  discount.MachineId || machineId;
          discount.LocationId =  discount.LocationId || location.LocationId;

          return discount;
        });
      }

      var processTenderDiscountItem = function (item, discount) {
        var data = { item: null, discount: null };
        // return getNextSeqNumber(item.ItemId).then(function (sn) {
          // renameProperty(discount, 'Id', 'DiscountId');
          renameProperty(discount, 'Percentage', 'DiscountPercentage');
          renameProperty(discount, 'Code', 'DiscountCode');
          // console.log(discount);
          discount = _.pick(discount, ['DiscountFrom', 'DiscountId', 'DiscountCode', 'DiscountFor', 'DiscountType', 'DiscountPercentage', 'DiscountAmount', 'SeqNo']);
          discount = _.extend(_.pick(item, ['BusinessDate', 'LocationId', 'MachineId', 'DocNo', 'ItemId', 'LineNumber']),discount);
          discount.DiscountFrom = 'T';
          discount.DiscountType = ""+parseInt(discount.DiscountType );
          discount.DocNo =  discount.DocNo || BillService.getCurrentReceiptId();
          discount.BusinessDate =  discount.BusinessDate || ControlService.getBusinessDate(true);
          discount.MachineId =  discount.MachineId || machineId;
          discount.LocationId =  discount.LocationId || location.LocationId;

          data.item = item;
          data.discount = discount;

          return data;
        // });
      }

      self.saveTempDiscountItem = function (item, discount) {
        DB.clearQueue();
        // item = ItemService.calculateTotal(item);
        if(item.DiscAmount > 0){
          item.isDiscounted = true;
        }
        var discountAmounts = calculateDiscountAmounts(item, discount);
        if(checkAmountEligibility(discountAmounts.item)){
          return processDiscountItem(discountAmounts.item, discountAmounts.discount).then(function (discount) {
            saveItemDiscount(discount);
            updateTempBillDetail(discountAmounts.item, { columns: 'DocNo=? AND ItemId=? AND LineNumber=?', data: [discountAmounts.item.DocNo, discountAmounts.item.ItemId, discountAmounts.item.LineNumber]});
            return DB.executeQueue().then(function () {
              return BillService.updateHeaderTotals(item.DocNo);
            });
          });
        } else {
          return $q.reject("Not eligible for this discount amount");
        }

      }

      self.saveMultipleTempDiscountItem = function (DocNo, discountSets) {
        var promises = [];
        DB.clearQueue();
        angular.forEach(discountSets, function(discountSet){
          if(discountSet.item && (discountSet.discount || discountSet.DiscountId)){
            var prom;
            if(discountSet.item.DiscAmount > 0){
              discountSet.item.isDiscounted = true;
            }
            if(discountSet.DiscountId){
              prom = self.getDiscountById(discountSet.DiscountId);
            } else {
              prom = $q.when(discountSet.discount);
            }

            promises.push(prom.then(function(discount){
              discountSet.item = ItemService.calculateTotal(discountSet.item);
              discount.DiscountId = discountSet.DiscountId;
              return processDiscountItem(discountSet.item, discount).then(function(dis){
                calculateDiscountAmounts(discountSet.item, dis);
                saveItemDiscount(dis);
                updateTempBillDetail(discountSet.item, { columns: 'DocNo=? AND ItemId=? AND LineNumber=?', data: [discountSet.item.DocNo, discountSet.item.ItemId, discountSet.item.LineNumber]});
                return true;
              });
            }));
          } else {
            promises.push($q.reject('Invalid item'));
          }
        });
        return $q.all(promises).then(function(){
          return DB.executeQueue().then(function () {
            return BillService.updateHeaderTotals(DocNo);
          });
        });
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
        if(item.Qty < 1){
          return false;
        }
        return true;
      }

      var checkAmountEligibility = function(item){
        // console.log(item);

        var total = item.SubTotal + item.Tax5Amount;
        var discount = (item.DiscAmount + item.Tax5DiscAmount).roundTo(2);

        if(item.isDiscounted){
          if(item.MultiDiscount == "false"){
            return false;
          }
        }
        if(discount > total){
          return false;
        }
        if(item.BelowCost == 'false'){
          if(item.StdCost > 0){
            if((total-discount) < (item.StdCost * item.Qty)){
              return false;
            }
          }
        }
        if(item.Qty < 1){
          return false;
        }
        return true;
      }

      var seq = null;

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

        var discountAmounts = [];
        if(!amount){
          amount = discount.Percentage ? (total * discount.Percentage || discount.DiscountPercentage) / 100 : parseFloat(discount.Amount);
        } else {
          amount = amount || parseFloat(discount.Amount);
        }

        // amount = parseFloat(amount);
        var headerDiscount = 0, headerSubDiscount = 0, totalEligibleDiscount = 0, headerTax5Disc = 0;
        var prec = 0;
        // discount.SeqNo = seq == null ? sn ;
        var seqPromise;
        if(seq == null){
          seqPromise = getNextSeqNumber(header.DocNo);
        } else {
          seqPromise = $q.when(seq);
        }
        seqPromise.then(function(s){
          if(!seq){
            seq = s;
          }
          discount.SeqNo = seq++;
          items = _.map(items, function (item, key) {
            var dItem = tenderDiscounts.items[item.LineNumber];

            if(dItem){
              item = dItem;
            }

            if(item.DiscAmount > 0){
              item.isDiscounted = true;
            }
            // totalDiscount  = (item.Total < discountPerItem ? item.Total : discount.Amount).roundTo(2);
            // subDiscount = ((totalDiscount * (100-item.Tax5Perc)) / 100).roundTo(2);
            item = ItemService.calculateTotal(item);
            if(!checkAmountEligibility(item)){
              item.TotalEligibleDiscount = 0;
            } else if(item.BelowCost == 'true' || item.StdCost == 0){
              item.TotalEligibleDiscount  = item.Total;
            } else {
              item.TotalEligibleDiscount = (item.StdCost * item.Qty) - item.Discount;
            }

            totalEligibleDiscount += item.TotalEligibleDiscount;
            return item;
          });



          if(totalEligibleDiscount == 0 || amount > totalEligibleDiscount){
            deferred.reject('Invalid Discount');
          } else {
            angular.forEach(_.values(items), function (item, key) {
              prec = item.TotalEligibleDiscount / totalEligibleDiscount;
              var discountAmount = 0;
              // if(key != _.size(items) - 1){
                discountAmount = (amount * prec).roundTo(2);
              // } else {
              //   discountAmount = (amount - headerDiscount).roundTo(2);
              // }
              var tax5Disc = ((discountAmount * item.Tax5Perc) / (100+item.Tax5Perc)).roundTo(2);
              var subDiscount = (discountAmount - tax5Disc).roundTo(2);

              item.Discount += discountAmount;
              item.Discount = item.Discount.roundTo(2);
              discount.DiscountAmount = angular.copy(discountAmount);
              item.DiscAmount += subDiscount.roundTo(2);
              item.Tax5DiscAmount += tax5Disc.roundTo(2);

              headerDiscount += discountAmount;
              headerSubDiscount += subDiscount;
              headerTax5Disc += tax5Disc;



              queue.push(processTenderDiscountItem(item, angular.copy(discount)));
            });

            return $q.all(queue).then(function(items){

              header.Discount += amount;
              var tax5DiscAmount = ((amount * location.Tax5Perc) / (100+location.Tax5Perc)).roundTo(2);
              header.Tax5DiscAmount += tax5DiscAmount;
              header.DiscAmount += (amount - tax5DiscAmount).roundTo(2);
              header = ItemService.calculateTotal(header);

              header.TenderTotal = header.Total.roundTo(2);

              header.UpdatedTenderTotal = header.Total.toFixed(2);
              header.UpdatedRoundedTotal = RoundingService.round(header.Total).toFixed(2);
              header.TotalRounded = RoundingService.round(header.Total).toFixed(2);
              // td.discounts = _.pluck(items, 'discount');
              angular.forEach(_.pluck(items, 'item'), function (item) {
                  tenderDiscounts.items[item.LineNumber] = item;
              });
              tenderDiscounts.discounts = _.pluck(items, 'discount');
              tenderDiscounts.header = header;

              if(amount != headerDiscount){ //add adjustment discount record
                var tempDiscount = angular.copy(_.first(tenderDiscounts.discounts));
                tempDiscount.ItemId = 0;
                tempDiscount.LineNumber = -1;
                tempDiscount.DiscountAmount = (amount - headerDiscount).roundTo(2);

                tenderDiscounts.discounts.push(tempDiscount);

              }
              deferred.resolve();
            }, function(ex){
              deferred.reject(ex);
            });
          }
        });



        return deferred.promise;

      };

      self.saveTenderDiscount = function (DocNo) {
        // var deferred = $q.defer();
        // console.log(tenderDiscounts);
        if(tenderDiscounts.discounts.length > 0){
          DB.clearQueue();
          angular.forEach(tenderDiscounts.discounts, function(dis){
              saveItemDiscount(dis);
          });

          angular.forEach(tenderDiscounts.items, function(item){
              // console.log(item);
              updateTempBillDetail(item);

          });

          return DB.executeQueue().then(function () {
            tenderDiscounts = {
                header: null,
                items: {},
                discounts: []
            };
            DB.clearQueue();
            return BillService.updateHeaderTotals(DocNo)
          }, function(ex){
            return ex;
            console.log(ex);
          });

        } else {
          return $q.resolve();
        }

      }

      self.clearTenderDiscounts = function(){
          tenderDiscounts = {
              items: {},
              discounts: []
          };
      }

      return self;
    }]);
