/**
 * Created by shalitha on 17/5/16.
 */
angular.module('itouch.services')
/**
 * This is the Database wrapper module
 */
  .factory('DB', ['$q', 'DB_CONFIG', 'DB_VIEWS', '$log', function ($q, DB_CONFIG, DB_VIEWS, $log) {
    var self = this;
    self.db = null;
    /**
     * Query queue
     * @type {Array}
       */
    var queue = [];
    var sqlLiteOff = false;

    /**
     * Initialize the database connection
     */
    self.init = function () {
      if (window.sqlitePlugin && sqlLiteOff == false) {
        self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name, location: 'default'});    //enables the sqllite plugin for development
      } else {
        self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1);     //enables the websql for testing purposes
      }
    };

    /**
     * Generates and add create table queries for the table list in db.config
     */
    self.createTables = function () {
      angular.forEach(DB_CONFIG.tables, function (table) {
        var columns = [];

        var cols = '';
        angular.forEach(table.columns, function (column) {
          columns.push(column.name + ' ' + column.type);
          cols += column.name + ',';
        });
        if (!table.keep) { //drop only keep == false tables
          self.addQueryToQueue('DROP TABLE IF EXISTS ' + table.name);
        }
        var q = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') ;
        if (table.primaryKey) {
          q += ', PRIMARY KEY(' + table.primaryKey + ')';
        }
        q += ')';
        self.addQueryToQueue(q);

      });

      angular.forEach(DB_VIEWS, function (view, name) {
        self.addQueryToQueue('DROP VIEW IF EXISTS ' + name);
        self.addQueryToQueue(view);
      });
    };

    self.createTable = function (table) {
      return self.db.transaction(function (transaction) {
        var columns = [];

        var cols = '';
        angular.forEach(table.columns, function (column) {
          columns.push(column.name + ' ' + column.type);
          cols += column.name + ',';
        });
        if (!table.keep) { //drop only keep == false tables
          transaction.executeSql('DROP TABLE IF EXISTS ' + table.name, []);
        }
        var q = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',');
        if (table.primaryKey) {
          q += ', PRIMARY KEY(' + table.primaryKey + ')';
        }
        q += ')';
        return transaction.executeSql(q, []);
      });
    };

    self.addCreateTableToQueue = function (table) {
      var columns = [];

      var cols = '';
      angular.forEach(table.columns, function (column) {
        columns.push(column.name + ' ' + column.type);
        cols += column.name + ',';
      });
      if (!table.keep) { //drop only keep == false tables
        self.addQueryToQueue('DROP TABLE IF EXISTS ' + table.name);
      }
      var q = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') ;
      if (table.primaryKey) {
        q += ', PRIMARY KEY(' + table.primaryKey + ')';
      }
      q += ')';
      self.addQueryToQueue(q);
    };


    /**
     * Execute a query
     * @param query
     * @param bindings
     * @returns {Promise}
       */
    self.query = function (query, bindings) {
      bindings = typeof bindings !== 'undefined' ? bindings : [];
      var deferred = $q.defer();

      ionic.Platform.ready(function () {
        self.db.transaction(function (transaction) {
          transaction.executeSql(query, bindings, function (transaction, result) {
            deferred.resolve(result);
          }, function (transaction, error) {
            deferred.reject(error);
          });
        });
      });

      return deferred.promise;
    };

    /**
     * Helper function to get Object[] from returned dataset
     * @param result
     * @returns {Array}
       */
    self.fetchAll = function (result) {
      var output = [];

      for (var i = 0; i < result.rows.length; i++) {
        output.push(result.rows.item(i));
      }

      return output;
    };

    self.fetch = function (result) {
      if (result.rows.length > 0) {
        return result.rows.item(0);
      } else {
        return null;
      }
    };

    /**
     * Creates & executes an insert query with given table name & data
     * @param tableName
     * @param bindings object with columnNames (keys) : data (value) ex { name: 'David' }
     * @returns {Promise}
     */
    self.insert = function (tableName, bindings) {
      var deferred = $q.defer();

      self.db.transaction(function (transaction) {
        var columnNames = _.keys(bindings);
        var values = _.values(bindings);
        var qs = '';
        angular.forEach(values, function (value, index) {
          qs += index != values.length - 1 ? '?,' : '?';
        });
        transaction.executeSql('INSERT INTO ' + tableName + '(' + columnNames.join(',') + ') VALUES(' + qs + ')', values, function (transaction, result) {
          deferred.resolve(result);
        }, function (transaction, error) {
          deferred.reject(error);
        });
      });

      return deferred.promise;
    };

    /**
     * Creates & executes an insert query with given table name & data
     * @param tableName
     * @param bindings object with columnNames (keys) : data (value) ex { name: 'David' }
     * @returns {Promise}
     */
    self.update = function (tableName, bindings, where) {
      var deferred = $q.defer();

      self.db.transaction(function (transaction) {
        var values = _.map(bindings, function (value) {
          return value;
        });
        var qs = [];
        var index = 0;
        angular.forEach(bindings, function (value, columnName) {
          values[index++] = value;
          qs.push(columnName + ' = ? ');
        });
        values = values.concat(where.data);
        transaction.executeSql('UPDATE ' + tableName + ' SET ' + qs.join(',') +  ' WHERE ' + where.columns, values, function (transaction, result) {
          deferred.resolve(result);
        }, function (transaction, error) {
          deferred.reject(error);
        });
      });

      return deferred.promise;
    };

    /**
     * Adds an insert statement to query queue
     * @param tableName
     * @param bindings
       */
    self.addInsertToQueue = function (tableName, bindings) {
      var data, qs, columnNames, query;
      if (_.isArray(bindings)) {
        angular.forEach(bindings, function (row) {
          forEachRow(tableName, row);
        });
      } else {
        forEachRow(tableName, bindings);
      }
    };
    var forEachRow = function (tableName, row) {
      data = [];
      columnNames = [];
      qs = [];
      angular.forEach(row, function (value, col) {
        columnNames.push(col);
        qs.push('?');
        data.push(value);
      });
      query = 'INSERT INTO ' + tableName + ' (' + columnNames.join(',') + ') VALUES(' + qs.join(',') + ')';
      queue.push({query: query, data: data});
    };

    var prepareUpdateQuery = function (tableName, bindings, where) {
      var values = _.map(bindings, function (value) {
        return value;
      });
      var qs = [];
      var index = 0;
      angular.forEach(bindings, function (value, columnName) {
        values[index++] = value;
        qs.push(columnName + ' = ? ');
      });
      values = values.concat(where.data);
      return {
        query: 'UPDATE ' + tableName + ' SET ' + qs.join(',') +  ' WHERE ' + where.columns,
        values: values
      };
    };

    /**
     * Adds an update statement to query queue
     * @param tableName
     * @param bindings
     */
    self.addUpdateToQueue = function (tableName, bindings, where) {
      var q = prepareUpdateQuery(tableName, bindings, where);
      queue.push({query: q.query, data: q.values});
    };

    /**
     * Adds an delete statement to query queue
     * @param tableName
     * @param bindings
     */
    self.addDeleteToQueue = function (tableName, where) {
      var q = 'DELETE FROM ' + tableName;
      var data = [];
      if (where) {
        q += ' WHERE ' + where.columns;
        data = where.data;
      }
      queue.push({query: q, data: data});
    };

    /**
     * Adds a query to queue
     * @param query
       */
    self.addQueryToQueue = function (query, data) {
      queue.push({query: query, data: data ? data : null});
    };

    /**
     * Executes the query queue within a transaction & rollbacks if an error is thrown
     * @returns {Promise}
       */
    self.executeQueue = function () {
      var deferred = $q.defer();
      if (queue.length > 0) {
        var query, values;
        self.db.transaction(function (tx) {
          angular.forEach(queue, function (dataSet, key) {
            dataSet.data = typeof dataSet.data !== 'undefined' ? dataSet.data : [];
            query = dataSet.query;
            values = dataSet.data;
            // console.log(query);
            // console.log(values);
            tx.executeSql(dataSet.query, dataSet.data, function (transaction, result) {
              deferred.resolve(result);
            }, function (transaction, error) {
              $log.log(error.message + ' in ' + query + ' (params : ' + values.join(', ') + ')');
              // throw new Error(error.message + " in " + query + " (params : "+values.join(", ")+")");
              deferred.reject(error.message + ' in ' + query + ' (params : ' + values.join(', ') + ')');
              // return false;
            });
          });
        });
      } else {
        deferred.reject('Nothing to execute');
      }

      return deferred.promise;
    };

    self.clearQueue = function () {
      queue = [];
    };

    /**
     * Executes a select statement
     * @param tableName
     * @param columns
     * @param where ex: { columns: 'name=? and age=?', data: ['joe', 21] }
     * @param limit
       * @returns {Promise}
       */
    self.select = function (tableName, columns, where, order, limit) {
      if (!columns) {
        columns = '*';
      }
      var q = 'SELECT ' + columns + ' FROM ' + tableName;
      if (where) {
        q += ' WHERE ' + where.columns;
      }
      if (order) {
        q += ' ORDER BY ' + order;
      }
      if (limit) {
        q += ' LIMIT ' + limit;
      }
      return self.query(q, where ? where.data : []);
    };

    self.selectGroupBy = function (tableName, columns, where, groupby, limit) {
      if (!columns) {
        columns = '*';
      }
      var q = 'SELECT ' + columns + ' FROM ' + tableName;
      if (where) {
        q += ' WHERE ' + where.columns;
      }
      if (groupby) {
        q += ' GROUP BY ' + groupby;
      }
      if (limit) {
        q += ' LIMIT ' + limit;
      }
      return self.query(q, where ? where.data : []);
    };

    self.max = function (table, column, where) {
      return self.select(table, 'MAX(' + column + ') AS max ', where, '1').then(function (result) {
        var ln = parseInt(self.fetch(result)['max'] || 0);
        if (isNaN(ln)) {
          ln = 0;
        }
        return ln;
      });
    };

    self.delete = function (tableName, where) {
      var q = 'DELETE FROM ' + tableName;
      if (where) {
        q += ' WHERE ' + where.columns;
      }
      return self.query(q, where ? where.data : []);
    };

    return self;
  }]);
