var DB = require("../index.js");
DB.sqlite.config("./example/sqlite");
var test = "sqlite";

var mysqlQuery = [
    {
        sql: "DROP TABLE TEST"
    },
    {
        sql: "CREATE TABLE TEST  (TEST_ID TEXT, TEST_PW TEXT)"
    },
    {
        sql: "INSERT INTO TEST (TEST_ID, TEST_PW) VALUES ?",
        param: [
            ["TTT1", "PW1"],
            ["TTT2", "PW2"],
            ["TTT3", "PW3"],
            ["TTT4", "PW4"],
            ["TTT5", "PW5"]
        ]
    },
    {
        sql: "INSERT INTO TEST (TEST_ID, TEST_PW) VALUES ?",
        param: [["test", "test"]]
    },
    {
        sql: "UPDATE TEST SET ? WHERE TEST_ID=?",
        param: [{TEST_PW: "P33W5"}, "TTT1"]
    },
    {
        sql: "SELECT * FROM TEST WHERE TEST_ID =?",
        param: ["TTT1"]
    },
    {
        sql: "SELECT * FROM TEST WHERE TEST_ID =? AND  TEST_PW =?",
        param: ["TTT1", "P33W5"]
    }
];

var sqliteQuery = [
    {
        sql: "DROP TABLE USER"
    },
    {
        sql: "CREATE TABLE USER (USER_ID TEXT, USER_PW TEXT)"
    },
    {
        sql: "INSERT INTO USER (USER_ID, USER_PW) VALUES (?,?)",
        param: [["test", "pass"], ["test", "pass"]]
    },
    {
        sql: "INSERT INTO USER (USER_ID, USER_PW) VALUES (?,?)",
        param: ["test", "pass"]
    },
    {
        sql: "INSERT INTO USER (USER_ID, USER_PW) VALUES (?,?)",
        param: [["test", "pass"], ["test", "pass"]]
    },
    {
        sql: "INSERT INTO USER (USER_ID, USER_PW) VALUES (?,?)",
        param: [["test", "pass"], ["test", "pass"]]
    },
    {
        sql: "SELECT * FROM USER WHERE USER_ID =?",
        param: [["test"]]
    }
];


if (test == "mysql") {
    DB.mysql.send(mysqlQuery, function (err, result) {
        console.log("err : ");
        console.log(JSON.stringify(err, "", ""));
        console.log("result : ");
        console.log(JSON.stringify(result, "", ""));
    });


} else if (test == "sqlite") {
    DB.sqlite.sends(sqliteQuery, function (err, result) {
        console.log("err : " + err);
        console.log("result : ");
        console.log(result);
    });

    // var query = {
    //     sql: "DROP TABLE USER"
    // };
    // console.log("=================================");
    // console.log("DROP");
    // console.log("=================================");
    // DB.sqlite.send(query, function (err, result) {
    //
    //     console.log("err : " + err);
    //     console.log("result : " + JSON.stringify(result));
    //     query = {
    //         sql: "CREATE TABLE USER (USER_ID TEXT, USER_PW TEXT)"
    //     };
    //
    //     console.log("=================================");
    //     console.log("CREATE");
    //     console.log("=================================");
    //     DB.sqlite.send(query, function (err, result) {
    //
    //         console.log("err : " + err);
    //         console.log("result : " + JSON.stringify(result));
    //
    //
    //         console.log("=================================");
    //         console.log("INSERT");
    //         console.log("=================================");
    //         query = {
    //             sql: "INSERT INTO USER (USER_ID, USER_PW) VALUES (?,?)",
    //             param: [["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"], ["test", "pass"]]
    //         };
    //         DB.sqlite.send(query, function (err, result) {
    //
    //             console.log("err : " + err);
    //             console.log("result : " + JSON.stringify(result));
    //
    //             query = {
    //                 sql: "SELECT * FROM USER ",
    //                 param: {}
    //             };
    //             DB.sqlite.send(query, function (err, result) {
    //                 console.log("=================================");
    //                 console.log("SELECT");
    //                 console.log("=================================");
    //                 console.log("err : " + err);
    //                 console.log("result : " + JSON.stringify(result));
    //             });
    //         });
    //     });
    // });

} 