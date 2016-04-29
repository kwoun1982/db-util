/*!
 * db-util
 * https://github.com/kwoun1982/db-util.git
 *
 * Copyright 2016 kiyoung kwoun
 * Released under the MIT license
 */
(function () {
    // ##################################################
    // MySql DB 설정
    // ##################################################
    var conn = null;
    var mysql = {
        createConnection: function () {
            if (conn == null) {
                conn = require('mysql').createConnection(require('./config.json').mysql);
            }
            return conn;
        },
        /*
         * 정상적으로 DB에서 데이터를 가져왔을 때 콜백이 있으면 결과를 넘겨서 수행, 없으면 결과를 리턴.
         */
        send: function (query, callback) {
            //console.log("[kky] :: ++++++++++++++++++++++++++++++++++++");
            //console.log("[kky] :: mysql.send(query, callback)");
            //console.log("[kky] :: ++++++++++++++++++++++++++++++++++++");
            var conn = this.createConnection();
            conn.connect(function (err) {
                if (err) {
                    console.log(err.stack);
                    if (callback) {
                        callback(err.message);
                    }
                    return err.stack;
                } else {
                }
            });

            // ===========================================
            // Sql 출력
            var printSql = query.sql;
            if (isClass(query.param, Array)) {
                for (var i = 0; i < query.param.length; i++) {
                    var param = query.param[i];
                    if (typeof query.param[i] == "undefined") {
                        param = " '' ";
                    }
                    printSql = printSql.replace("?", "'" + param + "'");
                }
            }
            printSql = replaceAll(",", ",\n      ", printSql);
            printSql = replaceAll("FROM", "\nFROM  ", printSql);
            printSql = replaceAll("WHERE", "\nWHERE ", printSql);
            console.log("\n" + printSql);

            // ===========================================
            // 쿼리문 실행
            conn.query(query.sql, query.param, function (err, rows, fields) {
                console.log("Result :: \n" + JSON.stringify(rows));
                if (err) {
                    console.log(err.stack);
                    if (callback) {
                        callback(err.message);
                    }
                } else {
                    if (callback) {
                        callback(rows);
                    }
                }
            });

            conn.end(function (err) {
                if (err) {
                    console.log(err.stack);
                    if (callback) {
                        callback(err.message);
                    }
                    return err.stack;
                } else {
                }
            });
        }
    };

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
            }
            var query = querys[sqlite_conf.multiCnt];
            var methods = Array.isArray(query.param) && Array.isArray(query.param[0]) ? "multiQuery" : "singleQuery";
            sqlite[methods](db, query, function (err, row) {

                sqlite_conf.rows.push(row);

                sqlite_conf.multiCnt++;
                query = querys[sqlite_conf.multiCnt];

                if (sqlite_conf.multiCnt > querys.length - 1) {
                    if (sqlite_conf.callback) {
                        sqlite_conf.callback(err, sqlite_conf.rows);
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
