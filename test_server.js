// let sql = require("./sql_functions.js");
var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer(app);
var db = new sqlite3.Database('./db.db');

app.get('/', function (req, res) {
    res.send("<h3> Hi there, You are going to perform CRUD operations.............[CREATE] Please enter 'http://localhost:3000/add/(id number)/(name)' to add new employee to the database.........................[READ] 'http://localhost:3000/view/(id number)' to view an employee.........................[UPDATE] 'http://localhost:3000/update/(id number)/(new name)' to update an employee.....................[DELETE] 'http://localhost:3000/del/(id number)' to delete an employee...............................Before closing this window, kindly enter 'http://localhost:3000/close' to close the database connection <h3>");
});

app.get('/v1', function (req, res) {
    let results = [];
    db.serialize(() => {

        db.each(
            'SELECT * FROM listings ORDER BY id DESC;',
            [],
            function (err, row) {
                if (err) {
                    res.send("Error encountered while displaying");
                    return console.error(err.message);
                }
                results.push([row.version, row.id, row.nft]);
                results.push(row);
                if (row.id < 30) {
                    results.push("yep");
                }
                // console.log(results);
                console.log("Entry displayed successfully");
            },
            function () {
                console.log("end");
                console.log(results);
                console.log("end");
                let r = '<table>'
                for (i in results) {
                    console.log(i);
                    r = r.concat(`<tr><th>${results[i[0]]}</th><th>${results[i[1]]}</th>`);
                }
                r = r.concat("</table>");
                // console.log(r);

                res.send(r);
            });
    });
    // res.send(results);
    // res.end();
});

app.get('/block', function (req, res) {
    let results = [];
    db.serialize(() => {

        db.each(
            'SELECT * FROM listings ORDER BY id DESC;',
            [],
            function (err, row) {
                if (err) {
                    res.send("Error encountered while displaying");
                    return console.error(err.message);
                }
                results.push(` ID: ${row.id},    Name: ${row.nft}`);
                if (row.id < 30) {
                    results.push("yep");
                }
                console.log(results);
                console.log("Entry displayed successfully");
            },
            function () {
                console.log("end");
                console.log(results);
                console.log("end");
                res.send(results.join("<br />"));
            });
    });
    // res.send(results);
    // res.end();
});

server.listen(3000, function () {
    console.log("Server listening on port: 3000");
});


    // // let x = sql.get_latest_block_in_sql();

    // function get_block() {
    //     var db = new sqlite3.Database('./db.db');
    //     let x = 1;
    //     console.log("hello");
    //     let result = db.all(
    //         "SELECT number FROM latest_block",
    //         function (err, rows) {
    //             console.log(rows[0].number);
    //             console.log(rows[0].number);
    //             x = rows[0].number;
    //             console.log(x);
    //         },
    //         function () {
    //             console.log("closing");
    //             db.close();
    //             return x;
    //         });
    //     // console.log("result, ", result);
    //     // res.write(`<h1>Learning Node.js http module!</h1><h2>${x}</h2>`);
    //     // db.close();
    // }

    // let xx = get_block();
    // console.log("block is " + xx);

    // var server = http.createServer(function (req, res) {
    //     var db = new sqlite3.Database('./db.db');
    //     let x = 1;
    //     res.writeHead(200);
    //     console.log("hello");
    //     db.all(
    //         "SELECT number FROM latest_block",
    //         function (err, rows) {
    //             console.log(rows[0].number);
    //             console.log(rows[0].number);
    //             res.write(rows[0].number.toString());
    //         });
    //     res.write(`<h1>Learning Node.js http module!</h1><h2>${x}</h2>`);
    //     db.close();
    //     get_block();
    // });
    // server.listen(8888);