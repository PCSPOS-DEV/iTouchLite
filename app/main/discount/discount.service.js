/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory("DiscountService", ['Restangular', 'SettingsService', '$q', '$localStorage', 'DB', 'DB_CONFIG', 'LocationService', 'BillService', '$filter', 'ItemService', 'ControlService', 'RoundingService','LocationService','BillService',
    function (Restangular, SettingsService, $q, $localStorage, DB, DB_CONFIG, LocationService, BillService, $filter, ItemService, ControlService, RoundingService,LocationService,BillService) {
      var self = this;
      var tenderDiscounts = {
        header: null,
        items: {},
        discounts: []
      };
      /*Yi Yi Po*/
      var tempTenderDiscounts={};
      var tempValidTenderDiscounts=[];
      var tempRoundedDiscounts=[];
      var previousRoundedDisc=0;
      /*--*/
      var previousDiscount=0;
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
              if(!_.isUndefined(res)){
                var items = JSON.parse(res); 
                if (items) {
                self.saveDiscounts(items);
                deferred.resolve();
                } else {
                  deferred.reject('Unknown machine');
                }
              }
              else{
                deferred.resolve();
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
              if(!_.isUndefined(res)){
                var items = JSON.parse(res);
                if (items) {
                self.saveDiscountsFor(items);
                deferred.resolve();
                } else {
                  deferred.reject('Unknown machine');
                }
             }
             else{
              deferred.resolve();
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
        //return ((subTotal * presentage) / 100).roundTo(2);
        return RoundingService.roundNumber(((subTotal * presentage) / 100),2);
      }

      var removeDiscountAmount = function (subTotal, presentage) {
        return ((subTotal * 100) / presentage).roundTo(2);
      }

      var updateTempBillDetail = function (item) {
        if(item.ItemType!='RND')
        {
          DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.tempDetail, _.pick(item, 'SubTotal', 'DiscAmount', 'Tax5DiscAmount'), {columns:'ItemId=? AND LineNumber=?', data: [item.ItemId, item.LineNumber]});
        }
        else
        {
          console.log('RND');
          console.log(item);
          DB.addUpdateToQueue(DB_CONFIG.tableNames.bill.tempDetail, _.pick(item, 'SubTotal','Tax5Amount', 'DiscAmount', 'Tax5DiscAmount'), {columns:'ItemId=? AND LineNumber=?', data: [item.ItemId, item.LineNumber]});
        }
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
          } 
          else {   
           
            /*Yi Yi Po*/
            totalDiscount = discount.Amount;
            subDiscount=((item.SubTotal/(item.SubTotal+item.Tax5Amount))*discount.Amount);
            /*--*/
            
        }

        totalDiscount = totalDiscount.roundTo(2);
        if(!location){ location = LocationService.currentLocation;}
        item.Discount = (item.Discount + totalDiscount).roundTo(2); 

        if(location.Tax5Option=='3'){

        item.DiscAmount = (item.DiscAmount + subDiscount).roundTo(2);
        item.Tax5DiscAmount = (item.Tax5DiscAmount +(totalDiscount - subDiscount)).roundTo(2); 

         /*Yi Yi Po*/
        if(item.Taxable=='true'){
            var totalTax=((item.Total-totalDiscount)/(100+item.Tax5Perc)*item.Tax5Perc).roundTo(2);
            var currentTax=(item.Tax5Amount-item.Tax5DiscAmount);
             if(currentTax<totalTax)
             {
               var differentDiscountTax=(totalTax-currentTax);
               item.Tax5DiscAmount-=differentDiscountTax;
               item.DiscAmount+=differentDiscountTax;
             }
             else if(currentTax>totalTax)
             {
              var differentDiscountTax=(currentTax-totalTax);
               item.Tax5DiscAmount+=differentDiscountTax;
               item.DiscAmount-=differentDiscountTax; 
             }
         }
        else
        {
          item.Tax5DiscAmount=0;
        }       
       /*--*/
      }
      else
      {
        item.DiscAmount = (item.DiscAmount + totalDiscount).roundTo(2);
        item.Tax5DiscAmount = 0;
      }
      discount.DiscountAmount = totalDiscount;
        
      return  {item: angular.copy(item), discount: angular.copy(discount)};
    }
      
      var getLineDiscountByItemLine=function(item){
      return DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, 'SUM(DiscountAmount) AS DiscountAmount', {columns: 'DocNo=? AND ItemId=? AND LineNumber=?', data: [item.DocNo, item.ItemId,item.LineNumber]}).then(function (res) {
          var line = DB.fetch(res);
          if(line){           
            return line.DiscountAmount;
          } else {
            return 0;
          }
        }, function (err) {
          return 0;
        });
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
      /*Yi Yi Po - (25-07-2017)*/
      self.prepareTenderDiscount = function (header, items, discount, amount) {
       
        var deferred = $q.defer();
        var discountSet;
        var totalDisamount=amount;
        var discountValues = {
          Discount: 0,
          DiscAmount: 0,
          Tax5DiscAmount: 0
        };
        var queue  = [];
        var total =0;
        tempValidTenderDiscounts=[];
        

        var totalEligibleDiscount = 0,totalDiscountAmount=0;
        var prec = 0,taxableDiscAmt=0,discTotal=0,totalTaxableAmount=0,totalTaxableSubTotal=0;
        var totalDetailDiscounts=0,totalDetailTax5Amount=0,totalAmount=0,totalPrevdiscount=0;
        var headerDiscount = 0, headerSubDiscount = 0,headerTax5Disc = 0;

        var roundedTax5Amount=0,roundedDiscAmount=0,roundedSubTotal=0,headerSubTotal=0;

        var currenttotalDisc=0;
        var newDiscountTotal=0; 
        var currentTaxabletotalDisc=0;
        var newTaxableDiscountTotal=0;   
        if(!location){ location = LocationService.currentLocation;}
        
        angular.forEach(items, function(item){
          if(item.ReasonId==0 && item.NoDiscount=='false'){
             var dItem = tenderDiscounts.items[item.LineNumber];
            if(dItem){
                  item = dItem;
                }
            item = ItemService.calculateTotal(item);
            total+=((item.SubTotal+item.Tax5Amount)-(item.Discount+item.Tax5DiscAmount)).roundTo(2);

             if((typeof tempTenderDiscounts.length!='undefined' || item.Discount!=0) && item.MultiDiscount!='true') 
              {
                 total-=(((item.SubTotal+item.Tax5Amount)-(item.Discount+item.Tax5DiscAmount))).roundTo(2);
              }

            }

          });   
        

        items = _.map(items, function (item, key) {

            var prevdiscountTotal=0;
            var dItem = tenderDiscounts.items[item.LineNumber];
            if(dItem){
              item = dItem;
            }
            
            item = ItemService.calculateTotal(item);
            item.discountAmount=0;
            if(item.ItemType!='PWI' && item.ItemType!='FRE' && item.ItemType!='RDM'){
                if(item.ReasonId==0 && item.NoDiscount=='false' ){
                  var applydiscountAmount=0;
                   if(discount.Percentage!=0){
                      //item.discountAmount=(item.Total * discount.Percentage/100).roundTo(2); 
                      applydiscountAmount=(item.Total * discount.Percentage/100);
                   }
                  else {
                      //item.discountAmount=((item.Total/total)*amount).roundTo(2);
                      applydiscountAmount=(item.Total/total)*amount;
                  }

                  item.discountAmount=RoundingService.roundNumber(applydiscountAmount,2);

                  //console.log("applydiscountAmount"+RoundingService.roundNumber(applydiscountAmount,2));
                }
                else{
                  item.discountAmount=0;
                }

                if((typeof tempTenderDiscounts.length!='undefined' || item.Discount!=0) && item.MultiDiscount!='true') 
                {
                  item.discountAmount = 0;
                }

               if(item.BelowCost == 'true' || item.StdCost == 0){              
                   if(item.discountAmount>(item.Qty *  item.OrgPrice))
                        item.discountAmount = 0;
                   else{
                         if(item.discountAmount!=0)
                            tempValidTenderDiscounts.push(item);
                      }
                }
                else {
                 if(item.ReasonId==0){
                      if((item.StdCost * item.Qty).roundTo(2)>(item.Total-item.discountAmount).roundTo(2)){               
                           item.discountAmount = 0; 
                 }
                 else{
                    if(item.discountAmount!=0)
                        tempValidTenderDiscounts.push(item);
                 }
                }
              }
            }
            prevdiscountTotal =(item.Discount+item.Tax5DiscAmount).roundTo(2);
            if(prevdiscountTotal>=item.SubTotal)
            {
             item.discountAmount=0;
            }
            /*Tax5DiscCaluclation*/
             if(location.Tax5Option=='3'){             
             //var previousDiscountPerc = 0;
             var discountforTotal = 0;

             var grandTotal=item.SubTotal+item.Tax1Amount+item.Tax2Amount+item.Tax3Amount+item.Tax4Amount+item.Tax5Amount;

             /*if (grandTotal > 0)
              {
                previousDiscountPerc = (prevdiscountTotal / grandTotal) * 100;
              }*/

             var taxBeforeDisc = 0, taxAfterDisc = 0, subTotalAfterDisc = 0, discountAmt = 0;
             discountAmt=item.discountAmount;

             taxBeforeDisc =(((grandTotal - prevdiscountTotal) / (location.Tax5Perc + 100)) * location.Tax5Perc).roundTo(2);
             subTotalAfterDisc = (grandTotal - prevdiscountTotal - item.discountAmount);

              if (item.Taxable=='true')
              {
                taxAfterDisc =((subTotalAfterDisc / (location.Tax5Perc + 100) * location.Tax5Perc)).roundTo(2);// ((GrandTotal - DiscAmt)) * (Tax5 / 100);
              }
              else
              {
                taxAfterDisc = taxBeforeDisc;
              }

            discountforTax5 =(taxBeforeDisc - taxAfterDisc).roundTo(2);
            discountforSubTotal =(item.discountAmount - discountforTax5).roundTo(2);

             item.DiscAmount +=discountforSubTotal;
             item.Tax5DiscAmount +=discountforTax5;
             headerTax5Disc+=discountforTax5;
             headerDiscount+=discountforSubTotal;
           }
           else
           {
            
             headerDiscount+=item.discountAmount;
             headerTax5Disc=0;
             item.DiscAmount+=item.discountAmount;
             item.Tax1DiscAmount = 0;
             item.Tax2DiscAmount = 0;
             item.Tax3DiscAmount = 0;
             item.Tax4DiscAmount = 0;
             item.Tax5DiscAmount = 0;
           }
           headerSubTotal+=item.SubTotal;
           if(item.Taxable=='true')
           {
            totalTaxableAmount+=((item.SubTotal+item.Tax5Amount)-(item.DiscAmount+item.Tax5DiscAmount)).roundTo(2);
            totalTaxableSubTotal+=(item.SubTotal+item.Tax5Amount).roundTo(2);
           }
           /*if(item.ItemType=='RND')
           {            
            totalTaxableAmount+=(item.Tax5Amount).roundTo(2);
            totalTaxableSubTotal+=(item.Tax5Amount).roundTo(2);
           }*/

           if(item.Taxable=='false'){item.Tax5Amount=0;item.Tax5DiscAmount=0;}
            totalDetailDiscounts+= (item.DiscAmount + item.Tax5DiscAmount-prevdiscountTotal).roundTo(2);
            totalDetailTax5Amount += (item.Tax5Amount - item.Tax5DiscAmount).roundTo(2);

            //if(item.ItemType=='RND')
                //totalAmount+=(item.SubTotal+item.Tax5Amount).roundTo(2);
            //else
            totalPrevdiscount+=prevdiscountTotal;
            if(item.ItemType!='RND')
                  totalAmount+=(item.OrgPrice * item.Qty);

        return item;
       });          
   
      if((total==0) || (tempValidTenderDiscounts.length==0)){           
            deferred.reject('Invalid Discount');
        }
      else {

            currenttotalDisc=0;
            newDiscountTotal=0;
            //currentTaxabletotalDisc=0;
            //newTaxableDiscountTotal=0;
            if(tempValidTenderDiscounts.length>0)
            {
              var newSubTotal=0; 
              var nexTaxableSubTotal=0;
              angular.forEach(_.values(tempValidTenderDiscounts), function (item, key) {
                if(item.discountAmount>0){
                  newSubTotal+=item.Total;
                  currenttotalDisc+=item.discountAmount;
                  /*if(item.Taxable=='true')
                  {
                    newTaxableDiscountTotal+=item.Total;
                    currentTaxabletotalDisc+=item.discountAmount;
                  }*/
               }
              });  
             currenttotalDisc=(currenttotalDisc).roundTo(2);
             //currenttotalDisc=(currenttotalDisc).roundTo(2);

              if(discount.Percentage!=0)
                  newDiscountTotal=RoundingService.roundNumber((newSubTotal * discount.Percentage/100),2);
                   //newDiscountTotal=(newSubTotal * discount.Percentage/100).roundTo(2);                
              else
                newDiscountTotal=RoundingService.roundNumber(((newSubTotal/total)*amount),2);
                //newDiscountTotal=((newSubTotal/total)*amount).roundTo(2);              
            }

            amount=0;                   
            headerTaxTotal=0;
            taxableDiscAmt=0;
           

            angular.forEach(_.values(items), function (item, key) { 
              var discountAmount =(item.discountAmount).roundTo(2);
                  amount+=discountAmount;
                discount.DiscountAmount = angular.copy(discountAmount);
              if(item.Taxable=='false'){item.Tax5Amount=0;item.Tax5DiscAmount=0;}  
              queue.push(processTenderDiscountItem(item, angular.copy(discount)));           
            });

    
      return $q.all(queue).then(function(items){
              var totalDiscounts=0;
              angular.forEach(_.pluck(items, 'discount'), function (item) {
                 totalDiscounts+=item.DiscountAmount;
              });
             
              totalDiscounts+=(newDiscountTotal - currenttotalDisc).roundTo(2); 
              totalTaxableAmount-=(newDiscountTotal - currenttotalDisc).roundTo(2);

              var headerTax5Total=RoundingService.roundNumber(((totalTaxableAmount/(100+location.Tax5Perc))*location.Tax5Perc),2);
              var tempTax5DiscAmount=RoundingService.roundNumber(((headerTax5Total/totalTaxableSubTotal) * (totalDiscounts+totalPrevdiscount)),2);              
              
              angular.forEach(_.pluck(items, 'item'), function (item) {

                if(item.ItemType=='RND'){
                  if(location.Tax5Option=='3')
                    {
                      if ((headerTax5Total != totalDetailTax5Amount) || (totalDiscounts != totalDetailDiscounts))
                      {
                        item.DiscAmount+=(totalDiscounts - totalDetailDiscounts).roundTo(2);
                        item.Tax5Amount+= (headerTax5Total - totalDetailTax5Amount).roundTo(2);
                        item.SubTotal += ((totalDiscounts - totalDetailDiscounts) * -1).roundTo(2);
                        item.Tax += (item.Tax5Amount-item.Tax5DiscAmount).roundTo(2);                        
                      }
                    }
                    else
                    {
                       //objTemp = clsItems.CalculateExclusiveHeaderTax(arrBillDetails, TotalNonTaxDiscounts);

                      //if ((objTemp.Tax1Amount != Tax1) || (objTemp.Tax2Amount != Tax2) || (objTemp.Tax3Amount != Tax3) || (objTemp.Tax4Amount != Tax4) ||
                        //(objTemp.Tax5Amount != Tax5) || (TotalDiscounts != TotalDetailDiscounts))
                        //{
                            //item.DiscAmount = totalDiscounts - totalDetailDiscounts;
                            //item.Tax1Amount = objTemp.Tax1Amount - Tax1;
                            //item.Tax2Amount = objTemp.Tax2Amount - Tax2;
                            //item.Tax3Amount = objTemp.Tax3Amount - Tax3;
                            //item.Tax4Amount = objTemp.Tax4Amount - Tax4;
                            //item.Tax5Amount = objTemp.Tax5Amount - Tax5;
                            //item.SubTotal = (totalDiscounts - totalDetailDiscounts) * -1;
                        //}
                    }
                   
                }

                tenderDiscounts.items[item.LineNumber] = item;
              });

              if(location.Tax5Option=='3')
              {
                tempTax5DiscAmount=(tempTax5DiscAmount||0);
                headerTax5Total=(headerTax5Total||0);
                header.SubTotal = totalAmount - headerTax5Total - tempTax5DiscAmount;
                header.DiscAmount = (totalDiscounts+totalPrevdiscount) - tempTax5DiscAmount;
                header.Tax5Amount = headerTax5Total + tempTax5DiscAmount;
                header.Tax5DiscAmount = tempTax5DiscAmount;
                header.Discount+=header.DiscAmount;
              }
              else
              {
                   /*header.DiscAmount = (totalDiscounts+totalPrevdiscount);
                   header.Tax1Amount = objTemp.Tax1Amount;
                   header.Tax2Amount = objTemp.Tax2Amount;
                   header.Tax3Amount = objTemp.Tax3Amount;
                   header.Tax4Amount = objTemp.Tax4Amount;
                   header.Tax5Amount = objTemp.Tax5Amount;*/
              }
             
              header = ItemService.calculateTotal(header); 
              
              tenderDiscounts.discounts = _.pluck(items, 'discount');
              tenderDiscounts.header = header; 
              if(currenttotalDisc != newDiscountTotal){ //add adjustment discount record
                var tempDiscount = angular.copy(_.first(tenderDiscounts.discounts));
                tempDiscount.ItemId = 0;
                tempDiscount.LineNumber = -1;
                tempDiscount.DiscountAmount = (newDiscountTotal - currenttotalDisc).roundTo(2);

                //DB.delete(DB_CONFIG.tableNames.discounts.tempBillDiscounts, {columns:'LineNumber=? AND ItemId=? AND DiscountFrom=? ', data: ['-1','0','T']});
                var seqPromise= getTempBillNextSeqNumber(tempDiscount.DocNo,tempDiscount.ItemId,tempDiscount.LineNumber);
                seqPromise.then(function(s){
                tempDiscount.SeqNo = s++;
                DB.insert(DB_CONFIG.tableNames.discounts.tempBillDiscounts,tempDiscount);
                });
              }
              
              header.TenderTotal = header.Total.roundTo(2);
              header.UpdatedTenderTotal = header.Total.toFixed(2);
              header.UpdatedRoundedTotal = RoundingService.round(header.Total).toFixed(2);
              header.TotalRounded = RoundingService.round(header.Total).toFixed(2);
              
              angular.forEach(_.pluck(items, 'discount'), function (discount) { 
                 if(discount.DiscountAmount>0){
                var seqPromise= getTempBillNextSeqNumber(discount.DocNo,discount.ItemId,discount.LineNumber);
                seqPromise.then(function(s){
                   discount.SeqNo = s++;
                   DB.insert(DB_CONFIG.tableNames.discounts.tempBillDiscounts,discount);
                 });
                }
              });              
              self.getTempTenderDiscounts().then(function (tempTDisc) {
                  tempTenderDiscounts=tempTDisc;
                });
              
              deferred.resolve();
            }, function(ex){
              deferred.reject(ex);
            });
          }
        /*});*/
        
        return deferred.promise;
        
      };
      /**/      
     var getTenderTotalDiscountByItemId = function (DocNo, ItemId,LineNumber) {
        return DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, 'SUM(DiscountAmount) AS DiscountAmount', {columns: 'DocNo=? AND ItemId=? AND LineNumber=?', data: [DocNo, ItemId,LineNumber]}).then(function (res) {
           var line = DB.fetch(res);
         if(line){           
            return line.DiscountAmount;
          } else {
            return 0;
          }
        }, function (err) {
          return 0;
        });

      }
       var getTotalDiscountByItemId = function (DocNo, ItemId,LineNumber) {
        return DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, 'SUM(DiscountAmount) AS DiscountAmount', {columns: 'DocNo=? AND ItemId=? AND LineNumber=?', data: [DocNo, ItemId,LineNumber]}).then(function (res) {
          var line = DB.fetch(res);
          if(line){           
            return line.DiscountAmount;
          } else {
            return 0;
          }
        }, function (err) {
          return 0;
        });

      }
      var getTempBillNextSeqNumber = function (DocNo, ItemId,LineNumber) {
        return DB.select(DB_CONFIG.tableNames.discounts.tempBillDiscounts, 'MAX(SeqNo) AS sq', {columns: 'DocNo=? AND ItemId=? AND LineNumber=?', data: [DocNo, ItemId,LineNumber]}).then(function (res) {
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
      self.clearTempTenderDiscounts=function(){
       DB.delete(DB_CONFIG.tableNames.discounts.tempBillDiscounts, {columns:'DiscountFrom=?', data: ['T']});
      
       tempTenderDiscounts={};
       totalDiscountAmount=0;
      };     
      self.getTempTenderDiscounts = function () {
      var deferred = $q.defer();
      DB.query("SELECT tb.ReasonId,tb.SubTotal,tb.Tax5Amount,td.DiscountAmount,Itm.MultiDiscount FROM TempBillDetail as tb INNER JOIN"+
                " Item as Itm ON Itm.Id=tb.ItemId INNER JOIN "+
                " TempBillDiscounts as td ON tb.DocNo=td.DocNo AND td.ItemId=tb.ItemId"  +
                " WHERE DiscountFrom=? AND tb.ReasonId=?", ['T','0']).then(function (result) {
        deferred.resolve(DB.fetchAll(result));
      }, function (err) {
        deferred.reject(err.message);
      });
      return deferred.promise;
     }
      /*---*/

      self.saveTenderDiscount = function (DocNo) {
        // var deferred = $q.defer();
        // console.log(tenderDiscounts);
        if(tenderDiscounts.discounts.length > 0){  
          DB.clearQueue();
          /*angular.forEach(tenderDiscounts.discounts, function(dis){
              saveItemDiscount(dis);
          });*/

          angular.forEach(tenderDiscounts.items, function(item){
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
        tempTenderDiscounts={};
        totalDiscountAmount=0;
        tempRoundedDiscounts=[];
        previousRoundedDisc=0;
      }

      return self;
    }]);
