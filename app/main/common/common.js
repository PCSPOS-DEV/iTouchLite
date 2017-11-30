/**
 * Created by shalitha on 9/6/16.
 */


/**
 * Manages the rounding for all the numbers
 * @returns {number}
 */
Number.prototype.roundTo = function(decimalPoints, step) {
  step || (step = 1.0);
  var inv = 1.0 / step;
  var val = +(Math.round(this.valueOf() + "e+"+decimalPoints)  + "e-"+decimalPoints);
  if(_.isNaN(val)){
    val = 0;
  }
  return (val * inv) / inv;
};

/**
 * Adds days to the Date object
 * @param days
 * @returns {Date}
 */
Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Checks whether 2 dates are equal
 * @param date
 * @returns {boolean}
 */
Date.prototype.equals = function(date) {
  return this.getTime() == date.getTime();
};

/**
 * Converts the string to Date format
 * @returns {*}
 */
String.prototype.toDate = function () {
  var d = null;
  try{
    var values = this.valueOf().substring(0, 10).split("-");
    if(values.length >= 3){
      d = new Date(parseInt(values[0]), parseInt(values[1])-1, parseInt(values[2]));
    }
  } catch(ex){}
  return d;
}

Number.prototype.toDate = function () {
  return new Date(this.valueOf());
}

/**
 * Adds zeros if number<10
 **/
function twoDigits(d) {
  if(0 <= d && d < 10) return "0" + d.toString();
  if(-10 < d && d < 0) return "-0" + (-1*d).toString();
  return d.toString();
}

/**
 * Returns a SQL DateTime format string from the date()
 * @returns {string}
 */
Date.prototype.toDateTime = function() {
  return this.getUTCFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
};

/**
 * Returns a SQL Date format string from the date()
 * @returns {string}
 */
Date.prototype.toSQLDate = function() {
  return this.getUTCFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate());
};

function renameProperty(object, oldAttributeName, newAttributeName){
  if(object){
    if (oldAttributeName == newAttributeName) {
      return object;
    }
    if (object.hasOwnProperty(oldAttributeName)) {
      object[newAttributeName] = angular.copy(object[oldAttributeName]);
      delete object[oldAttributeName];
    }
  }
}
