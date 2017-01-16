/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.controllers')
  .controller("PrinterSetupCtrl", ['$log', 'PrintService', 'Alert', 'Reciept',
    function ($log, PrintService, Alert, Reciept) {
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

        // if(!printer){
        //   Alert.success('Printer not connected', 'Error');
        //   return false;
        // }

        // printer.addTextAlign(printer.ALIGN_CENTER);
        // // printer.addTextStyle(false, false, true);
        // printer.addText('Hello World\n');
        // printer.addTextSize(1, 1);
        // printer.addTextRotate(false);
        // printer.addTextAlign(printer.ALIGN_LEFT);
        // var text = "";
        // for(var i = 1; i <= 40; i++){
        //   text += i > 9 ? i%10 : i;
        // }
        // printer.addText(text+"\n");
        // printer.addTextAlign(printer.ALIGN_RIGHT);
        // printer.addText('\t\t\t27.00\n');
        // printer.addTextAlign(printer.ALIGN_LEFT);
        // printer.addText('Test item 2');
        // printer.addTextAlign(printer.ALIGN_RIGHT);
        // printer.addText('\t\t\t27.00\n');
        // printer.addText('Test item 3 548954385389');
        // printer.addTextAlign(printer.ALIGN_RIGHT);
        // printer.addText('\t\t\t27.00\n');
        // printer.addLogo(48, 48);
        // printer.addBarcode('12345', printer.BARCODE_CODE39, printer.HRI_BELOW, printer.FONT_A, 2, 32);
        // PrintService.addLine('test', '20.00', '1');
        // PrintService.addLine('test', '300.00', '10');
        // PrintService.addLine('test test test test test', '300.00', '4');
        // PrintService.addLine('test test test test test test', '3.00', '224');
        // PrintService.addTabbedLine('test test test test test', '3.00');
        // // printer.addPageEnd();
        // printer.addCut(printer.CUT_FEED);
        //
        // if(PrintService.isConnected()){
        //   try {
        //     printer.send();
        //   } catch(e){
        //     console.log(e);
        //   }
        // } else {
        //   Alert.success('Not connected', 'Error');
        // }

        Reciept.print('R00015');

        // Reciept.print();
      }

    }]);
