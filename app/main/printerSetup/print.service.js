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
        maxCharsPerLine: 48,
        maxCharsPerTabbedLine: 40,
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
                //Displays the successful print message
                deferred.resolve();
                //Registers the print complete event
                printer.onreceive = function (response) {
                  if (response.success) {
                    console.log('device recived');
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

      self.onRecieve = function(func){
        if(_.isFunction(func)){
          printer.onreceive = func;
        }
      }

      self.onReconnect = function(func){
        if(_.isFunction(func)){
          printer.onreconnect = func;
        }
      }

      self.onReconnecting = function(func){
        if(_.isFunction(func)){
          printer.onreconnecting = func;
        }
      }

      self.onRecieve = function(func){
        if(_.isFunction(func)){
          printer.onreceive = func;
        }
      }

      self.onOnline = function(func){
        if(_.isFunction(func)){
          printer.ononline = func;
        }
      }

      self.onOffline = function(func){
        if(_.isFunction(func)){
          printer.onpoweroff = func;
        }
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
        return ePosDev.isConnected();
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

      self.addTitle = function(text){
        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addTextSize(2, 2);
        printer.addTextStyle(false, false, true);
        printer.addText(text+"\n");
        printer.addTextStyle(false, false, false);
        printer.addTextSize(1, 1);
        printer.addTextAlign(printer.ALIGN_LEFT);
      }

      self.addReportLine = function(startBlock, endBlock, qtyBlock){

        if(startBlock && endBlock){
          var lengths  = {
            start: startBlock.length,
            end: endBlock.length,
            qty: qtyBlock ? qtyBlock.length : 0,
            spaces: 0,
            total: $localStorage.printeSettings.maxCharsPerLine,
            startBlockMaxLength: 22
          }

          if(startBlock.length > lengths.startBlockMaxLength){
            startBlock = startBlock.slice(0, (lengths.startBlockMaxLength - 2));
            startBlock += "...";
            // console.log(startBlock);
          }

          lengths.spaces = 22 - lengths.start;
          lengths.spaces  = lengths.spaces < 1 ? 1 : lengths.spaces;

          printer.addText("  " +startBlock);

          addSpaces(lengths.spaces);

          if(qtyBlock){
            addSpaces(4 - lengths.qty);
            printer.addText(qtyBlock);
          } else {
            addSpaces(4);
          }
          addSpaces(12);

          if(lengths.end < 8){
            addSpaces(8 - lengths.end);
          }

          printer.addText(endBlock + '\n');
        }
      }

      self.addLine = function(text){
        printer.addText(text + '\n');
      }

      self.addLineBreak = function(){
        printer.addText('\n');
      }

      self.alignCenter = function(){
        printer.addTextAlign(printer.ALIGN_CENTER);
      }

      self.alignLeft = function(){
        printer.addTextAlign(printer.ALIGN_LEFT);
      }

      self.alignRight = function(){
        printer.addTextAlign(printer.ALIGN_RIGHT);
      }

      return self;
    }]);
