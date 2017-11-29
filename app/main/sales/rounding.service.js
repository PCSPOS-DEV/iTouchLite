/**
 * Created by shalitha on 30/5/16.
 */
angular.module('itouch.services')
.factory('RoundingService', ['SettingsService', function (SettingsService) {
  var roundFor = SettingsService.getRoundFor();
  var roundDelta = SettingsService.getRoundDelta();

  var self = this;

  self.round = function (amount) {
    if (roundFor == 'M' || roundFor == 'C')//Mathematical rounding
    {
      if (roundFor == 'M')//Mathematical rounding
      {
        return roundNear(amount);
      }

      var TmpDelta = 0;
      var Temp = 0;

      if (roundFor == 'C')//Consumer rounding
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
      throw new Exception('Invalid rounding configuration.');
    }
  };
  self.roundNumber = function (num, decimalPlaces) {
    var d = decimalPlaces || 0;
    var m = Math.pow(10, d);
    var n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
    var i = Math.floor(n), f = n - i;
    var e = 1e-8; // Allow for rounding errors in f
    var r = (f > 0.5 - e && f < 0.5 + e) ?
                ((i % 2 == 0) ? i : i + 1) : Math.round(n);
    return d ? r / m : r;
  };


  var roundNear = function (amount) {
    var Desc = 0;
    var varX = 0;
    var intX = 0;

    //varX = amount / roundDelta;
    varX = self.roundNumber((amount / roundDelta), 2);
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
  };

  return self;
}]);
