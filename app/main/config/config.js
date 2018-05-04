/**
 * Created by shalitha on 31/5/16.
 */
'use strict';
angular.module('itouch.config')
  .factory('AppConfig', ['$localStorage', function ($localStorage) {
    if (!$localStorage.itouchConfig) {
      $localStorage.itouchConfig = {
        // baseUrl: 'http://172.16.110.99/iTouchLiteSyncServices/iTouchLiteSyncService.svc/',
        baseUrl: 'http://172.16.110.114:89/iTouchLiteSyncServices/iTouchLiteSyncService.svc/',
        outletServerUrl: 'http://172.16.110.114:89/iTouchLiteSyncServices/iTouchLiteSyncService.svc/',
        DisplayUrl: 'http://172.16.110.99:999/api/Item',
        //baseUrl: 'http://localhost:49952/iTouchLiteSyncService.svc/',
        //outletServerUrl: 'http://localhost:49952/iTouchLiteSyncService.svc/',
        name: 'ITouch Lite',
        version: '0.1',
        debug: true
      };
    }

    return {
      getBaseUrl: function () {
        return $localStorage.itouchConfig.baseUrl;
      },
      setBaseUrl: function (url) {
        if (url) {
          $localStorage.itouchConfig.baseUrl = url;
        }
      },
      getDisplayUrl: function () {
        return $localStorage.itouchConfig.DisplayUrl;
      },
      setDisplayUrl: function (url) {
        if (url) {
          $localStorage.itouchConfig.DisplayUrl = url;
        }
      },
      getOutletServerUrl: function () {
        return $localStorage.itouchConfig.outletServerUrl;
      },
      setOutletServerUrl: function (url) {
        if (url) {
          $localStorage.itouchConfig.outletServerUrl = url;
        }
      }
    };

  }]);
