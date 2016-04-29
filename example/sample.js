var DB = require("../index.js");
DB.sqlite.config("./example/sqlite");

var query = {
    sql: "DROP TABLE USER"
};
console.log("=================================");
console.log("DROP");
console.log("=================================");
DB.sqlite.send(query, function (err, result) {

    console.log("err : " + err);
    console.log("result : " + JSON.stringify(result));
    query = {
        sql: "CREATE TABLE USER (USER_ID TEXT, USER_PW TEXT)"
    };

    console.log("=================================");
    console.log("CREATE");
    console.log("=================================");
    DB.sqlite.send(query, function (err, result) {

        console.log("err : " + err);
        console.log("result : " + JSON.stringify(result));


        console.log("=================================");
        console.log("INSERT");
        console.log("=================================");
        query = {
            sql: "INSERT INTO USER (USER_ID, USER_PW) VALUES (?,?)",
            param: [["test", "pass"], ["test", "pass"]]
        };
        DB.sqlite.send(query, function (err, result) {

            console.log("err : " + err);
            console.log("result : " + JSON.stringify(result));

            query = {
                sql: "SELECT * FROM USER ",
                param: {}
            };
            DB.sqlite.send(query, function (err, result) {
                console.log("=================================");
                console.log("SELECT");
                console.log("=================================");
                console.log("err : "+err);
                console.log("result : "+JSON.stringify(result));
            });
        });
    });
});