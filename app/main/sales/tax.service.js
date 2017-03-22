/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
.factory("TaxService", ['LocationService', function (LocationService) {
  var self = this;

  /**
   * Calculates taxes for the given item with current location
   * @param item
   * @returns item
   */
  self.calculateTax = function (item) {
    var Tax1 = 0, Tax2 = 0, Tax3 = 0, Tax4 = 0, Tax5 = 0, SubTotal = 0, NewSubTotal = 0, Discount = 0, DiscountforTax1 = 0, DiscountforTax2 = 0, DiscountforTax3 = 0, DiscountforTax4 = 0, DiscountforTax5 = 0;
    var Takeaway = item.TakeAway;
    var location = LocationService.currentLocation;

    if (_.isNaN(item.AlteredPrice)) {
      item.AlteredPrice = parseFloat(item.AlteredPrice).roundTo(2);
    }
    if (_.isNaN(item.Qty)) {
      item.Qty = parseFloat(item.Qty);
    }
    if(!item.Price){
      item.Price = 0;
    }

    if(!item.OrgPrice) item.OrgPrice = item.Price;
    if(!item.AlteredPrice) item.AlteredPrice = item.Price;
    if(_.isUndefined(item.StdCost)) item.StdCost = 0;
    if(!item.WaCost) item.WaCost = 0;
    if(!item.DiscAmount) item.DiscAmount = 0;
    if(!item.Tax1DiscAmount || _.isNaN(item.Tax1DiscAmount)) item.Tax1DiscAmount = 0;
    if(!item.Tax2DiscAmount || _.isNaN(item.Tax2DiscAmount)) item.Tax2DiscAmount = 0;
    if(!item.Tax3DiscAmount || _.isNaN(item.Tax3DiscAmount)) item.Tax3DiscAmount = 0;
    if(!item.Tax4DiscAmount || _.isNaN(item.Tax4DiscAmount)) item.Tax4DiscAmount = 0;
    if(!item.Tax5DiscAmount || _.isNaN(item.Tax5DiscAmount)) item.Tax5DiscAmount = 0;

    if(!item.Tax1Amount || _.isNaN(item.Tax1Amount)) item.Tax1Amount = 0;
    if(!item.Tax2Amount || _.isNaN(item.Tax2Amount)) item.Tax2Amount = 0;
    if(!item.Tax3Amount || _.isNaN(item.Tax3Amount)) item.Tax3Amount = 0;
    if(!item.Tax4Amount || _.isNaN(item.Tax4Amount)) item.Tax4Amount = 0;
    if(!item.Tax5Amount || _.isNaN(item.Tax5Amount)) item.Tax5Amount = 0;

    SubTotal = (item.OrgPrice * item.Qty).roundTo(2);

    if (!item.Taxable) {
      return item;
    } else {
      Discount = item.DiscAmount + item.Tax1DiscAmount + item.Tax2DiscAmount + item.Tax3DiscAmount + item.Tax4DiscAmount + item.Tax5DiscAmount;

      var DiscountPrec = 0;
      if (Discount != 0) {
        if (SubTotal > 0) {
          DiscountPrec = (Discount / SubTotal) * 100;
        }
      }

      if (location.Tax5Option == 3) { //if tax5 has set to option 3 (inclusive in selling price) other taxes are not applicable
        var TempSub = 0;
        var TaxforNonDiscountAmount = 0;
        NewSubTotal = SubTotal - Discount;

        //Tax5 = Math.Round(SubTotal * (location.Tax5Perc / 100), 2);
        Tax5 = ((SubTotal / (100 + location.Tax5Perc)) * (location.Tax5Perc)).roundTo(2);

        if (Math.abs(Discount) > 0) {
          //Decimal DiscFromTax = Tax5 * (DiscPerc / 100);

          TaxforNonDiscountAmount = ((NewSubTotal / (100 + location.Tax5Perc)) * (location.Tax5Perc)).roundTo(2);

          DiscountforTax5 = Tax5 - TaxforNonDiscountAmount;
        } else {
          SubTotal = SubTotal - item.DiscAmount.roundTo(2);
          //NewSubTotal = SubTotal;

          //=================Tax1 calculation==================
          if (!(Takeaway && ControlService.getTakeAwayTax() == 1)) {
            if (location.Tax1Option == 1) {
              Tax1 = (SubTotal * (location.Tax1Perc / 100)).roundTo(2);
            }
          }
          //=============end tax1 calculation===================


          //=================Tax2 calculation==================
          if (!(Takeaway && ControlService.getTakeAwayTaxPOS() == 2)) {
            if (location.Tax2Option == 1) {
              Tax2 = (SubTotal * (location.Tax2Perc / 100)).roundTo(2);
            }
            else if (location.Tax2Option == 2) {
              Tax2 = (SubTotal + Tax1) * (location.Tax2Perc / 100).roundTo(2);
            }
          }
          //=============end tax2 calculation===================


          //=================Tax3 calculation==================
          if (!(Takeaway && ControlService.getTakeAwayTaxPOS() == 3)) {
            if (location.Tax3Option == 1) {
              Tax3 = (SubTotal * (location.Tax3Perc / 100)).roundTo(2);
            }
            else if (location.Tax3Option == 4) {
              Tax3 = (SubTotal + Tax1 + Tax2) * (location.Tax3Perc / 100).roundTo(2);
            }
          }
          //=============end tax3 calculation===================


          //=================Tax4 calculation==================
          if (!(Takeaway && ControlService.getTakeAwayTaxPOS() == 4)) {
            if (location.Tax4Option == 1) {
              Tax4 = SubTotal * (location.Tax4Perc / 100).roundTo(2);
            }
            else if (location.Tax4Option == 2) {
              Tax4 = (SubTotal + Tax1 + Tax2 + Tax3) * (location.Tax4Perc / 100).roundTo(2);
            }
          }
          //=============end tax4 calculation===================


          //=================Tax5 calculation==================
          if (!(Takeaway && ControlService.getTakeAwayTaxPOS() == 5)) {
            if (location.Tax5Option == 1) {
              Tax5 = (SubTotal * (location.Tax5Perc / 100)).roundTo(2);
            }
            else if (location.Tax5Option == 2) {
              Tax5 = ((SubTotal.roundTo(2) + Tax1.roundTo(2) + Tax2.roundTo(2) + Tax3.roundTo(2) + Tax4.roundTo(2)) * (location.Tax5Perc / 100)).roundTo(2);


            }

            if (Discount > 0)
            {
              // var DiscFromTax = (Tax5 * (DiscountPrec / 100)).roundTo(4);
              DiscountforTax5 = (Tax5 * (DiscountPrec / 100)).roundTo(4);
              // DiscountforTax5 = Math.Round(DiscountforTax5, 4);
            }
          }
          //=============end tax5 calculation===================
        }
        item.Tax1Amount = Tax1.roundTo(2);
        item.Tax2Amount = Tax2.roundTo(2);
        item.Tax3Amount = Tax3.roundTo(2);
        item.Tax4Amount = Tax4.roundTo(2);
        item.Tax5Amount = Tax5.roundTo(2);
        item.Tax1DiscAmount = DiscountforTax1.roundTo(2);
        item.Tax2DiscAmount = DiscountforTax2.roundTo(2);
        item.Tax3DiscAmount = DiscountforTax3.roundTo(2);
        item.Tax4DiscAmount = DiscountforTax4.roundTo(2);
        item.Tax5DiscAmount = DiscountforTax5.roundTo(2);

        if (location.Tax5Option == 3) {
          item.SubTotal = SubTotal - Tax5;
          if(item.Taxable){
            // item.OrgPrice = item.Price;
            // item.AlteredPrice = deductTax(item.Price, parseInt(location.Tax5Perc)).roundTo(2);
            // item.StdCost = item.AlteredPrice;
          }
        } else {
          // item.OrgPrice = item.Price;
          // item.AlteredPrice = item.Price;
          // item.StdCost = item.Price;

        }
        item.SubTotal = (item.SubTotal).roundTo(2);

      }
      return item;
    }
  }

  return self;
}]);
