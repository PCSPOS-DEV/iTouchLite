/**
 * Created by shalitha on 30/5/16.
 */
angular.module("itouch.logger", [])
  .factory('Logger', [function(){
    var debug = true;
    var db;

    return {
      init: function () {
        if (window.sqlitePlugin) {
          db = window.sqlitePlugin.openDatabase({name: 'ITouchLite_debug'});    //enables the sqllite plugin for development
        } else {
          db = window.openDatabase('ITouchLite_debug', '1.0', 'database', -1);     //enables the websql for testing purposes
        }
        db.transaction(function (tx) {
          tx.executeSql("CREATE TABLE IF NOT EXISTS error_log(id integer primary key, message text, name text, stack text, user text, cause text)");
        });
      },
      setDebug: function (isDebug) {
        debug = isDebug;
      },
      log: function (message) {

      },
      error: function (exception, cause) {
        var data = {
          type: 'angular',
          url: window.location.hash,
          localtime: Date.now()
        };
        if(cause)               { data.cause    = cause;              }
        if(exception){
          if(exception.message) { data.message  = exception.message;  }
          if(exception.name)    { data.name     = exception.name;     }
          if(exception.stack)   { data.stack    = exception.stack;    }
        }

        var errorId = null;
        if(db){
          db.transaction(function (tx) {
            tx.executeSql("INSERT INTO error_log(message, name, stack, cause) VALUES(?, ?, ?, ?)", [data.message, data.name, data.stack, data.cause], function (tx, results) {
              errorId = results.insertId;
              output(debug, data, errorId);
            }, function(tx, err) {
              window.alert(err.message);
              return true;
            });
          });
        } else {
          output(debug, data);
        }


      }
    }
  }]);
//outputs the errors according to environment
var output = function (debug, data, errorId) {
  if(debug){
    console.log('exception', data);
    window.alert('Error: '+data.message);

    // DB.insert(DB_CONFIG.tableNames.common.errorLog, data);
  } else {
    console.log('exception', data);
    window.alert('Error Occurred: Please contact administrator. ' + errorId ? "Error ID : " + errorId : '');
  }
}
