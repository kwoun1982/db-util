/*!
 * async
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
            console.log("[kky] :: ++++++++++++++++++++++++++++++++++++");
            console.log("[kky] :: mysql.send(query, callback)");
            console.log("[kky] :: ++++++++++++++++++++++++++++++++++++");
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
        send: function (query, callback) {
            // log.debug("[kky] :: ++++++++++++++++++++++++++++++++++++");
            // log.debug("[kky] :: sqlite.send(query, callback)");
            // log.debug("[kky] :: ++++++++++++++++++++++++++++++++++++");

            if (!sqlite_conf.server) {
                throw Error("server info not found!");
            }

            var conn = this.createConnection();
            var db = new conn.Database(sqlite_conf.server);
            db.serialize(function () {
                if (Array.isArray(query.param) && Array.isArray(query.param[0])) {
                    db.run("BEGIN TRANSACTION");
                    var stmt = db.prepare(query.sql);
                    var queryCnt = 1;
                    for (var i = 0; i < query.param.length; i++) {
                        stmt.run(query.param[i], function (err, row) {
                            queryCnt++;

                            if (err) {
                                db.run("ROLLBACK");
                                if (callback) {
                                    db.close(function () {
                                        if (callback) {
                                            callback(err, {result: 0});
                                        }
                                    });
                                    return;
                                }
                            }
                            if (queryCnt == query.param.length) {

                                if (callback) {
                                    db.close(function () {
                                        if (callback) {
                                            callback(err, {result: query.param.length});
                                        }
                                    });
                                    return;
                                }
                            }
                        });
                    }
                    stmt.finalize();
                    db.run("END TRANSACTION");
                } else {
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
                        db.close(function () {
                            if (callback) {
                                callback(err, row);
                            }
                        });


                    });
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
