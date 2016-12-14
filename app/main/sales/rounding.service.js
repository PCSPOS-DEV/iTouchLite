/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
.factory("RoundingService", ['SettingsService', function (SettingsService) {
  var roundFor = SettingsService.getRoundFor();
  var roundDelta = SettingsService.getRoundDelta();

  var self = this;

  self.round = function (amount) {
    if (roundFor == "M" || roundFor == "C")//Mathematical rounding
    {
      if (roundFor == "M")//Mathematical rounding
      {
        return roundNear(amount);
      }

      var TmpDelta = 0;
      var Temp = 0;

      if (roundFor == "C")//Consumer rounding
      {
        TmpDelta = -(roundDelta);

        if (amount < 0)
        {
          TmpDelta = TmpDelta * -1;
        }
      }

      if (TmpDelta == 0)
      {
        return amount;
      }

      Temp = (amount / TmpDelta);

      if (parseInt(Temp) == Temp)
      {
        return amount;
      }
      else
      {
        return Math.floor(((amount + (2 * TmpDelta)) / TmpDelta) - 1) * TmpDelta;
      }
    }
    else
    {
      throw new Exception("Invalid rounding configuration.");
    }
  }

  var roundNear = function (amount) {
    var desc = 0;
    var varX = 0;
    var intX = 0;

    varX = amount / roundDelta;
    intX = parseInt(varX);
    Desc = parseFloat(varX) - intX;

    if (Desc >= 0.5)
    {
      return roundDelta * (intX + 1);
    }
    else
    {
      return roundDelta * intX;
    }
  }

  return self;
}]);
