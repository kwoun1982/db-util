/*!
 * db-util
 * https://github.com/kwoun1982/db-util.git
 *
 * Copyright 2016 kiyoung kwoun
 * Released under the MIT license
 */
(function () {
    // ##################################################
    // MySql 
    // ##################################################
    var mysql_conf = {};
    var mysql = { 
        config: function (server) {
            mysql_conf = server;  
        },
        createConnection: function () {
            return require('mysql').createConnection(mysql_conf);
        },
        send: function (query, callback) {
            var conn = this.createConnection();
            conn.connect(function (err) {
                if (err) {
                    log.debug(err.stack);
                    if (typeof callback == "function") {
                        callback(err.message);
                    }
                    return err.stack;
                } else {
                }
            });

            var queryCnt = 0;
            var rRow = [];
            var rErr = [];

            function exeQuery(conn, query) {
                var selectSql = query[queryCnt];
                if (selectSql.sql.indexOf("INSERT") > -1) {
                    selectSql.param = [selectSql.param];
                }

                conn.query(selectSql.sql, selectSql.param, function (err, rows, fields) {
                    try {
                        if (selectSql.sql.indexOf("SELECT") == -1) {
                            rows = {result: rows.affectedRows};
                        }
                        if (err) {
                            console.error(err);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    rRow.push(rows);
                    rErr.push(err);
                    if (query.length - 1 == queryCnt) {
                        callback(rErr, rRow);
                        conn.end(function (err) {
                            if (err) {
                                console.error(err.stack);
                            }
                        });
                    } else {
                        queryCnt = queryCnt + 1;
                        exeQuery(conn, query);
                    }
                });
            }

            exeQuery(conn, query);
        }
    };

    // ##################################################
    // sqlite
    // ##################################################

    var sqlite_conf = {};
    var sqlite = {
        config: function (server) {
            sqlite_conf.server = server;
        },
        createConnection: function () {
            if (sqlite_conf.conn == null) {
                sqlite_conf.conn = require('sqlite3').verbose();
            }
            return sqlite_conf.conn;
        },
        multiQuery: function (db, query, callback) {
            db.run("BEGIN TRANSACTION");
            var stmt = db.prepare(query.sql);
            var queryCnt = 1;
            for (var i = 0; i < query.param.length; i++) {
                stmt.run(query.param[i], function (err, row) {
                    queryCnt++;
                    if (err) {
                        db.run("ROLLBACK");
                        if (callback) {
                            if (callback) {
                                callback(err, {result: 0});
                            }
                            return;
                        }
                    }
                    if (queryCnt == query.param.length) {
                        if (callback) {
                            if (callback) {
                                callback(err, {result: query.param.length});
                            }
                            return;
                        }
                    }
                });
            }
            stmt.finalize();
            db.run("END TRANSACTION");
        },
        singleQuery: function (db, query, callback) {
            db.all(query.sql, query.param, function (err, row) {
                if (err) {
                    console.error(err);
                    row = {result: 0};
                } else {
                    if (query.sql.toUpperCase().indexOf("SELECT") > -1) {
                    } else {
                        // update, insert, delete
                        if (typeof  row != "array") {
                            row = [];
                        }
                        row = {result: 1};
                    }
                }
                if (callback) {
                    callback(err, row);
                }

            });
        },
        send: function (query, callback) {
            if (!sqlite_conf.server) {
                throw Error("server info not found!");
            }
            var conn = this.createConnection();
            var db = new conn.Database(sqlite_conf.server);
            db.serialize(function () {
                var methods = Array.isArray(query.param) && Array.isArray(query.param[0]) ? "multiQuery" : "singleQuery";
                sqlite[methods](db, query, function (err, row) {
                    db.close(function () {
                        if (callback) {
                            callback(err, row);
                        }
                    });
                });
            });
        },
        sends: function (querys, callback) {
            if (!Array.isArray(querys)) {
                callback({result: 0});
                return;
            }
            var conn = this.createConnection();
            var db = new conn.Database(sqlite_conf.server);
            db.serialize(function () {
                sqlite_conf.multiCnt = null;
                sqlite.sendsSql(db, querys, function (err, rows) {
                    db.close(function () {
                        callback(err, rows);
                    });
                });
            });
        },
        sendsSql: function (db, querys, callback) {
            if (sqlite_conf.multiCnt == null) {
                sqlite_conf.multiCnt = 0;
                sqlite_conf.callback = callback;
                sqlite_conf.rows = [];
                sqlite_conf.err = [];
            }
            var query = querys[sqlite_conf.multiCnt];
            var methods = Array.isArray(query.param) && Array.isArray(query.param[0]) ? "multiQuery" : "singleQuery";
            if (query.sql.indexOf("INSERT") == -1) {
                methods = "singleQuery";
            }

            sqlite[methods](db, query, function (err, row) {
                sqlite_conf.rows.push(row);
                sqlite_conf.err.push(err);
                sqlite_conf.multiCnt++;
                query = querys[sqlite_conf.multiCnt];

                if (sqlite_conf.multiCnt > querys.length - 1) {
                    if (sqlite_conf.callback) {
                        sqlite_conf.callback(sqlite_conf.err, sqlite_conf.rows);
                    }
                } else {
                    sqlite.sendsSql(db, querys);
                }
            });
        }
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = {
            mysql: mysql,
            sqlite: sqlite
        };
    }
}());

function replaceAll(replaceThis, withThis, inThis) {
    withThis = withThis.replace(/\$/g, "$$$$");
    return inThis.replace(new RegExp(replaceThis.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|<>\-\&])/g, "\\$&"), "g"), withThis);
}
