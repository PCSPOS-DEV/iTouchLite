
angular.module('itouch.services')
.service('PrintService', function ($log, $q, $localStorage) {
  var self = this;

     var ePosDev = new epson.ePOSDevice();

     var printer = null;
     $localStorage.printeSettings = {
       ipAddress: null,
       port: null
     };

     self.connect = function (ipAddress, port) {
       var deferred = $q.defer();
       if (ePosDev && _.isObject(ePosDev)) {
         ePosDev.connect(ipAddress || $localStorage.printeSettings.ipAddress, port || $localStorage.printeSettings.port, function (resultConnect) {
           var deviceId = 'local_printer';
           var options = {'crypto': false, 'buffer': false};

           if ((resultConnect == 'OK') || (resultConnect == 'SSL_CONNECT_OK')) {
             //Retrieves the Printer object
             ePosDev.createDevice(deviceId, ePosDev.DEVICE_TYPE_PRINTER, options, function (deviceObj, errorCode) {
                 if (deviceObj === null) {
                   //Displays an error message if the system fails to retrieve the Printer object
                   deferred.reject("connect error. code:" + errorCode);
                   return;
                 }
                 printer = deviceObj;
                 //Registers the print complete event
                 printer.onreceive = function (response) {
                   if (response.success) {
                     //Displays the successful print message
                     deferred.resolve();
                   } else {
                     //Displays error messages
                     deferred.reject("connect error. code:" + errorCode);
                   }
                 };
               });
           }
           else {
             //Displays error messages
             deferred.reject(resultConnect);
           }
         });
       } else {
         deferred.reject("Lib error");
       }
       return deferred.promise;
     }

     self.disconnect = function () {
       var deferred = $q.defer();
       ePosDev.deleteDevice(printer, function (errorCode) {
         deferred.resolve();
         ePosDev.disconnect();
       });
       return deferred.promise;
     }

     self.getPrinter = function () {
       return printer;
     }

     self.setIPAddress = function(ip){
       if(ip){
         $localStorage.printeSettings.ipAddress = ip;
       }
     }

     self.setPort = function(port){
       if(port){
         $localStorage.printeSettings.port = port;
       }
     }

     self.isConnected = function(){
       return ePosDev.isConnected;
     }

     return self;
});
