/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("PrinterSetupCtrl", ['$log', 'PrintService', 'Alert',
    function ($log, PrintService, Alert) {
      var self = this;

      self.save = function(ip, port){
        PrintService.setIPAddress(ip);
        PrintService.setPort(port);

        PrintService.connect(ip, port).then(function(){
          Alert.success('Success');
        }, function(err){
          Alert.success(err, 'Error');
        });
      }

      self.printSample = function(){
        var printer = PrintService.getPrinter();

        if(!printer){
          Alert.success('Printer not connected', 'Error');
          return false;
        }

        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addText('Hello World\n');

        if(PrintService.isConnected()){
          printer.send();
        } else {
          Alert.success('Not connected', 'Error');
        }
      }

    }]);
