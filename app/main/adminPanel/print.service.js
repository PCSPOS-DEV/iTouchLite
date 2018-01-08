/**
 * Created by shalitha on 27/6/16.
 */
angular.module('itouch.services')
  .factory('PrintService', ['ErrorService', '$q', '$localStorage',
    function (ErrorService, $q, $localStorage) {
      var self = this;

      var ePosDev = new epson.ePOSDevice();
      self.drawerOpen = false;
      self.status = 'offline';

      var printer = null;
      $localStorage.printeSettings = {
        ipAddress: '192.168.1.204',
        port: '8008',
        maxCharsPerLine: 48,
        maxCharsPerTabbedLine: 40,
      };

      self.connect = function () {
        var deferred = $q.defer();
        self.status = 'connecting';
        if (ePosDev && _.isObject(ePosDev)) {
          console.log('connecting');
          ePosDev.connect($localStorage.printeSettings.ipAddress, $localStorage.printeSettings.port, function (resultConnect) {
            var deviceId = 'local_printer';
            var options = {'crypto': false, 'buffer': false};

            if ((resultConnect == 'OK') || (resultConnect == 'SSL_CONNECT_OK')) {
              self.status = 'connected';
              console.log('connected');
              //Retrieves the Printer object
              console.log('creating device');
              ePosDev.createDevice('local_printer', ePosDev.DEVICE_TYPE_PRINTER, options, function (deviceObj, errorCode) {
                if (deviceObj === null) {
                  //Displays an error message if the system fails to retrieve the Printer object
                  deferred.reject('connect error. code:' + errorCode);
                  return;
                }
                console.log('device created');
                self.status = 'created';
                printer = deviceObj;
                // self.addImage();
                //Displays the successful print message
                // printer.startMonitor();
                printer.onpapernearend = onReceive;

                printer.ondraweropen = function () {
                  self.drawerOpen = true;
                };

                printer.ondrawerclosed = function () {
                  self.drawerOpen = false;
                };

                deferred.resolve();
                //Registers the print complete event
              });
            }
            else {
              //Displays error messages
              self.status = 'failed';
              deferred.reject('connect error');
            }
          }, {'eposprint': true});
        } else {
          self.status = 'failed';
          deferred.reject('Lib error');
        }
        return deferred.promise;
      };

      self.onRecieve = function (func) {
        if (_.isFunction(func)) {
          printer.onreceive = func;
        }
      };

      self.onReconnect = function (func) {
        if (_.isFunction(func)) {
          printer.onreconnect = func;
        }
      };

      self.onReconnecting = function (func) {
        if (_.isFunction(func)) {
          printer.onreconnecting = func;
        }
      };

      self.onRecieve = function (func) {
        if (_.isFunction(func)) {
          printer.onreceive = func;
        }
      };

      self.onOnline = function (func) {
        if (_.isFunction(func)) {
          printer.ononline = func;
        }
      };

      self.onOffline = function (func) {
        if (_.isFunction(func)) {
          printer.onpoweroff = func;
        }
      };

      self.onPaperNearEnd = function (func) {
        if (_.isFunction(func)) {
          printer.onpapernearend = func;
        }
      };

      self.onPaperEnd = function (func) {
        if (_.isFunction(func)) {
          printer.onpaperend = func;
        }
      };

      self.isDrawerOpen = function () {
        return self.drawerOpen;
      };

      self.disconnect = function () {
        var deferred = $q.defer();
        ePosDev.deleteDevice(printer, function (errorCode) {
          deferred.resolve();
          ePosDev.disconnect();
        });
        return deferred.promise;
      };

      self.getPrinter = function () {
        return printer;
      };

      self.setIPAddress = function (ip) {
        if (ip) {
          $localStorage.printeSettings.ipAddress = ip;
        }
      };

      self.setPort = function (port) {
        if (port) {
          $localStorage.printeSettings.port = port;
        }
      };

      self.isConnected = function () {
        return printer != null;
      };

      self.addLine = function (startBlock, endBlock, qtyBlock) {
        // PrintService.addLine(text, " "+(sTotal.toFixed(2)), ""+row.Qty);
        if (startBlock && endBlock) {
          var lengths  = {
            start: startBlock.length,
            end: endBlock.length,
            qty: qtyBlock ? qtyBlock.length : 0,
            spaces: 0,
            total: $localStorage.printeSettings.maxCharsPerLine,
            startBlockMaxLength: 0
          };

          lengths.startBlockMaxLength = lengths.total - (4 + 12 + 2); // 4: qty, 12: price

          if (startBlock.length > lengths.startBlockMaxLength) {
            startBlock = startBlock.slice(0, (lengths.startBlockMaxLength - 2));
            startBlock += '....';
            // console.log(startBlock);
          }

          lengths.spaces = ((lengths.total - ((lengths.qty ? 4 : 0) + 12)) - lengths.start );
          lengths.spaces  = lengths.spaces < 1 ? 1 : lengths.spaces;

          if (qtyBlock) {
            addSpaces(3 - lengths.qty);
            printer.addText(qtyBlock + ' ');
          }

          printer.addText(startBlock);

          addSpaces(lengths.spaces);

          if (lengths.end < 12) {
            addSpaces(12 - lengths.end);
          }

          printer.addText(endBlock + '\n');
        }
      };

      var addSpaces = function (count) {
        var text = '';
        for (var i = 1; i <= count; i++) {
          text += ' ';
        }
        printer.addText(text);
      };

      self.addTabbedLine = function (startBlock, endBlock) {
        if (startBlock) {
          var lengths = {
            start: startBlock.length,
            end: endBlock ? endBlock.length : 0,
            spaces: 0,
            total: $localStorage.printeSettings.maxCharsPerTabbedLine,
            startBlockMaxLength: 0
          };
          if (endBlock) {
            lengths.startBlockMaxLength = lengths.total - 12;

            lengths.spaces = lengths.startBlockMaxLength - startBlock.length;
          } else {
            lengths.startBlockMaxLength = lengths.total - 1;
            lengths.spaces = lengths.total - startBlock.length;
          }

          if (startBlock.length > lengths.startBlockMaxLength) {
            startBlock = startBlock.slice(0, (lengths.startBlockMaxLength - 2));
            startBlock += '....';
          }

          if (length.spaces < 1) {
            length.spaces = 1;
          }


          printer.addText('\t' + startBlock);
          addSpaces(lengths.spaces);

          if (lengths.end < 12) {
            addSpaces(12 - lengths.end);
          }

          printer.addText(endBlock + '\n');
        }
      };

      self.addHLine = function () {
        var text = ' ';
        for (var i = 1; i <= ($localStorage.printeSettings.maxCharsPerLine - 2); i++) {
          text += '-';
        }
        text += ' \n';
        printer.addText(text);

      };

      self.addTitle = function (text) {
        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addTextSize(2, 2);
        printer.addTextStyle(false, false, true);
        printer.addText(text + '\n');
        printer.addTextStyle(false, false, false);
        printer.addTextSize(1, 1);
        printer.addTextAlign(printer.ALIGN_LEFT);
      };

      self.addReportLine = function (startBlock, endBlock, qtyBlock) {

        if (startBlock && endBlock) {
          var lengths  = {
            start: startBlock.length,
            end: endBlock.length,
            qty: qtyBlock ? qtyBlock.length : 0,
            spaces: 0,
            total: $localStorage.printeSettings.maxCharsPerLine,
            startBlockMaxLength: 22
          };

          if (startBlock.length > lengths.startBlockMaxLength) {
            startBlock = startBlock.slice(0, (lengths.startBlockMaxLength - 2));
            startBlock += '...';
            // console.log(startBlock);
          }

          lengths.spaces = 22 - lengths.start;
          lengths.spaces  = lengths.spaces < 1 ? 1 : lengths.spaces;

          printer.addText('  ' + startBlock);

          addSpaces(lengths.spaces);

          if (qtyBlock) {
            printer.addText(qtyBlock);
            addSpaces(4 - lengths.qty);
          } else {
            addSpaces(4);
          }
          addSpaces(8);

          if (lengths.end < 8) {
            addSpaces(8 - lengths.end);
          }

          printer.addText(endBlock + '\n');
        }
      };

      self.addTextLine = function (text) {
        printer.addText(text + '\n');
      };

      self.addLineBreak = function () {
        printer.addText('\n');
      };

      self.alignCenter = function () {
        printer.addTextAlign(printer.ALIGN_CENTER);
      };

      self.alignLeft = function () {
        printer.addTextAlign(printer.ALIGN_LEFT);
      };

      self.alignRight = function () {
        printer.addTextAlign(printer.ALIGN_RIGHT);
      };

      var onReceive = function (res) {
        console.log(res);
          // Obtain the print result and error code
          // var msg = ' Print ' + (res.success ? ' Success ' : ' Failure ') + '\n Code:' + res.code + '\n Status:\n';
          //
          // // Obtain the printer status
          // var asb = res.status;
          // if (asb & printer.ASB_NO_RESPONSE)		{	msg += ' No printer response\n';	}
          // if (asb & printer.ASB_PRINT_SUCCESS)		{	msg += ' Print complete\n';	}
          // if (asb & printer.ASB_DRAWER_KICK)		{	msg += ' Status of the drawer kick number 3 connector pin = "H"\n';	}
          // if (asb & printer.ASB_OFF_LINE)			{	msg += ' Offline status\n';	}
          // if (asb & printer.ASB_COVER_OPEN)		{	msg += ' Cover is open\n';	}
          // if (asb & printer.ASB_PAPER_FEED)		{	msg += ' Paper feed switch is feeding paper\n';	}
          // if (asb & printer.ASB_WAIT_ON_LINE)		{	msg += '  Waiting for online recovery\n';	}
          // if (asb & printer.ASB_PANEL_SWITCH)		{	msg += ' Panel switch is ON\n';	}
          // if (asb & printer.ASB_MECHANICAL_ERR)	{	msg += ' Mechanical error generated\n';	}
          // if (asb & printer.ASB_AUTOCUTTER_ERR)	{	msg += ' Auto cutter error generated\n';	}
          // if (asb & printer.ASB_UNRECOVER_ERR)		{	msg += ' Unrecoverable error generated\n';	}
          // if (asb & printer.ASB_AUTORECOVER_ERR)	{	msg += ' Auto recovery error generated\n';	}
          // if (asb & printer.ASB_RECEIPT_NEAR_END)	{	msg += ' No paper in the roll paper near end detector\n';	}
          // if (asb & printer.ASB_RECEIPT_END)		{	msg += ' No paper in the roll paper end detector\n';	}
          // if (asb & printer.ASB_SPOOLER_IS_STOPPED){	msg += ' Stop the spooler\n';	}
          // // Display in the dialog box
          // if ( res.success == false ){
          //   alert(msg);
          // }
          // this.Success = res.success;
          // this.finish = true;
      };

      self.addImage = function () {
        try {
          var canvas = document.getElementById('canvas');
          if (canvas.getContext) {
            var context = canvas.getContext('2d');
            printer.addImage(context, 0, 0, canvas.width, canvas.height);
          }
        }
        catch (e) {
          alert(e.message);
        }
      };

      return self;
    }]);
