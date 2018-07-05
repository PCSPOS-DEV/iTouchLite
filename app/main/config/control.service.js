/**
 * Created by shalitha on 18/5/16.
 */
angular.module('itouch.services')
  .factory('ControlService', ['$localStorage', function ($localStorage) {
    var self = this;
    if (!$localStorage.app_config) {
      $localStorage.app_config = {};
    }

    $localStorage.app_config.taTax = $localStorage.app_config.taTax || null;
    $localStorage.app_config.currentDocId = $localStorage.app_config.currentDocId || 'R00001';
    // if(!$localStorage.app_config.businessDate){
    //   $localStorage.app_config.businessDate =  new Date();
    // }
    // if(!$localStorage.app_config.dayEndDate){
    //   $localStorage.app_config.dayEndDate =  new Date();
    // }


    self.setTakeAwayTaxPOS = function (taTax) {
      $localStorage.app_config.taTax = taTax;
    };

    self.getTakeAwayTaxPOS = function () {
      return $localStorage.app_config.taTax;
    };

    /**
     * Returns the parsed Business date
     * Note: toDate function is embedded to string and number prototypes in common/common.js
     * @returns {Date}
       */
    self.getBusinessDate = function (format) {
      if (format) {
        return (_.isNumber($localStorage.app_config.businessDate)) ? moment($localStorage.app_config.businessDate).format('YYYY-MM-DD') : $localStorage.app_config.businessDate;
      } else {
        return (_.isNumber($localStorage.app_config.businessDate)) ? moment($localStorage.app_config.businessDate) : $localStorage.app_config.businessDate;
      }

    };

    /**
     * Returns the parsed day end date
     * Note: toDate function is embedded to string and number prototypes in common/common.js
     * @returns {Date}
     */
    self.getDayEndDate = function () {
      return (_.isNumber($localStorage.app_config.dayEndDate)) ? moment($localStorage.app_config.dayEndDate) : $localStorage.app_config.dayEndDate;
    };

    /**
     * Saves the given date as business date
     * @param date
     */
    self.setBusinessDate = function (moment) {
      $localStorage.app_config.businessDate = moment.valueOf();
    };

    // /**
    //  * Returns the parsed day end date
    //  * Note: toDate function is embedded to string and number prototypes in common/common.js
    //  * @returns {Date}
    //    */
    // self.getDayEndDate = function () {
    //   return (_.isString($localStorage.app_config.dayEndDate) || _.isNumber($localStorage.app_config.dayEndDate)) ? moment($localStorage.app_config.dayEndDate) : $localStorage.app_config.dayEndDate;
    // }

    /**
     * Saves the given date as business date
     * @param date
       */
    self.setBusinessDate = function (moment) {
      $localStorage.app_config.businessDate = moment.valueOf();
    };

    /**
     * Saves the given date as day end date
     * @param date
     */
    self.setDayEndDate = function (m) {
      $localStorage.app_config.dayEndDate = m.valueOf();
      self.setBusinessDate(moment([1950, 0, 1])); //setting business date to 1950-jan-01 (month is 0 based in js)
      // $localStorage.app_config.businessDate = moment().valueOf();
    };

    /**
     * Returns the next business date
     * Note: addDays function is embedded to date prototype in common/common.js
     * @returns {Date}
       */
    self.getNextBusinessDate = function () {
      if (self.getBusinessDate() && moment([1950, 0, 1]).diff(self.getBusinessDate())) {
        return self.getBusinessDate().add(1, 'days');
      } else {
        return (self.getDayEndDate() ? self.getDayEndDate().add(1, 'days') : moment());
      }
    };

    /**
     * Returns the next business date
     * Note: addDays function is embedded to date prototype in common/common.js
     * @returns {Date}
     */
    self.isNewBusinessDate = function () {
      if (self.getBusinessDate() && moment([1950, 0, 1]).diff(self.getBusinessDate())) {
        return false;
      } else {
        return true;
      }
    };

    /**
     * Returns the next DocId
     * @returns {string}
       */
    self.getNextDocId = function () {
      if ($localStorage.app_config.currentDocId && _.isString($localStorage.app_config.currentDocId)) {
        var newId = parseInt($localStorage.app_config.currentDocId.substring(1, 6));
        var maxId = 99999;
        if (newId == maxId) {
          newId = 0;
        }
        return 'R' + ('00000' + (++newId)).slice(-5);
      } else {
        return 'R00001';
      }
    };

    /**
     * Saves the current DocId
     * @param docId
       */
    self.saveDocId = function (docId) {
      $localStorage.app_config.currentDocId = docId;
    };

    self.getDocId = function () {
      return $localStorage.app_config.currentDocId;
    };

    self.getTakeAwayTaxPOS = function () {
      return 2;
    };

    self.getTakeAwayTax = function () {
      return 0;
    };

    self.counterDocId = function (DocNo) {
      self.saveDocId(DocNo);
      var nextId = self.getNextDocId();
      //console.log(self.getDocId());
      self.saveDocId(nextId);
      //console.log(nextId);
    };

    return self;
  }]);
