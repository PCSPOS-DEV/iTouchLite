/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory("PrintService", ['ErrorService', '$q', '$localStorage',
    function (ErrorService, $q, $localStorage) {
      var self = this;

      var ePosDev = new epson.ePOSDevice();

      var printer = null;
      $localStorage.printeSettings = {
        ipAddress: '192.168.1.205',
        port: '8008',
        maxCharsPerLine: 32,
        maxCharsPerTabbedLine: 26,
      };

      self.connect = function (ipAddress, port) {
        var deferred = $q.defer();
        if (ePosDev && _.isObject(ePosDev)) {
          console.log('connecting');
          ePosDev.connect($localStorage.printeSettings.ipAddress, $localStorage.printeSettings.port, function (resultConnect) {
            var deviceId = 'local_printer';
            var options = {'crypto': false, 'buffer': false};

            if ((resultConnect == 'OK') || (resultConnect == 'SSL_CONNECT_OK')) {
              console.log('connected');
              //Retrieves the Printer object
              console.log('creating device');
              ePosDev.createDevice('local_printer', ePosDev.DEVICE_TYPE_PRINTER, options, function (deviceObj, errorCode) {
                if (deviceObj === null) {
                  //Displays an error message if the system fails to retrieve the Printer object
                  deferred.reject("connect error. code:" + errorCode);
                  return;
                }
                console.log('device created');
                printer = deviceObj;
                //Registers the print complete event
                printer.onreceive = function (response) {
                  if (response.success) {
                    console.log('device recived');
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
              deferred.reject("connect error");
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

      self.addLine = function(startBlock, endBlock, qtyBlock){

        if(startBlock && endBlock){
          var lengths  = {
            start: startBlock.length,
            end: endBlock.length,
            qty: qtyBlock ? qtyBlock.length : 0,
            spaces: 0,
            total: $localStorage.printeSettings.maxCharsPerLine,
            startBlockMaxLength: 0
          }

          lengths.startBlockMaxLength = lengths.total - (4 + 8 + 2); // 4: qty, 8: price

          if(startBlock.length > lengths.startBlockMaxLength){
            startBlock = startBlock.slice(0, (lengths.startBlockMaxLength - 2));
            startBlock += "...";
            // console.log(startBlock);
          }

          lengths.spaces = ((lengths.total - ((lengths.qty ? 4 : 0) + 8)) - lengths.start );
          lengths.spaces  = lengths.spaces < 1 ? 1 : lengths.spaces;

          if(qtyBlock){
            addSpaces(3 - lengths.qty);
            printer.addText(qtyBlock + " ");
          }

          printer.addText(startBlock);

          addSpaces(lengths.spaces);

          if(lengths.end < 8){
            addSpaces(8 - lengths.end);
          }

          printer.addText(endBlock + '\n');
        }
      }

       var addSpaces = function(count){
        var text = "";
        for(var i = 1; i <= count; i++){
          text += " ";
        }
        printer.addText(text);
      }

      self.addTabbedLine = function(startBlock, endBlock){
        if(startBlock) {
          var lengths = {
            start: startBlock.length,
            end: endBlock ? endBlock.length : 0,
            spaces: 0,
            total: $localStorage.printeSettings.maxCharsPerTabbedLine,
            startBlockMaxLength: 0
          }
          if (endBlock) {
            lengths.startBlockMaxLength = lengths.total - 8;

            lengths.spaces = lengths.startBlockMaxLength - startBlock.length;
          } else {
            lengths.startBlockMaxLength = lengths.total - 1;
            lengths.spaces = lengths.total - startBlock.length;
          }

          if (startBlock.length > lengths.startBlockMaxLength) {
            startBlock = startBlock.slice(0, (lengths.startBlockMaxLength - 2));
            startBlock += "...";
          }

          if (length.spaces < 1) {
            length.spaces = 1;
          }


          printer.addText('\t' + startBlock);
          addSpaces(lengths.spaces);
          if (lengths.end < 8) {
            addSpaces(8 - lengths.end);
          }
          printer.addText(endBlock + "\n");
        }
      }

      self.addHLine = function(){
        var text = ' ';
        for(var i = 1; i <= ($localStorage.printeSettings.maxCharsPerLine-2); i++){
          text += "-";
        }
        text += ' \n';
        printer.addText(text);

      }

      return self;
    }]);
