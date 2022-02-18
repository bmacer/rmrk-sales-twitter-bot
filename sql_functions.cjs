const sqlite3 = require('sqlite3').verbose()

let FILE = "./db.db";

module.exports.gett = function (callback) {
    get_block(callback);
}


module.exports.getBlock = () => {
    var db = new sqlite3.Database(FILE);
    return new Promise((resolve, reject) => {
        // db.serialize(() => {
        db.get('SELECT number FROM latest_block;', [], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
        // });
    })
}

module.exports.getListings = () => {
    var db = new sqlite3.Database(FILE);
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM listings;', [], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}

module.exports.getListingsByCollectionId = (collection_id) => {
    var db = new sqlite3.Database(FILE);
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM listings WHERE collection=(?);', [collection_id], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}




function get_block(callback) {
    var db = new sqlite3.Database(FILE);
    let number = 0;

    db.get(`SELECT number FROM latest_block`,
        [], (err, rows) => {
            if (err) {
                console.log("errror");
                return console.log(err.message);
            }
            console.log(rows);
            callback(rows.number);
            db.close();
            return number;
        });
    // db.close();
    // console.log("...", number);
}



/*

function getColour(username, roomCount, callback)
{
    connection.query('SELECT hexcode FROM colours WHERE precedence = ?', [roomCount], function(err, result)
    {
        if (err) 
            callback(err,null);
        else
            callback(null,result[0].hexcode);

    });

}

//call Fn for db query with callback
getColour("yourname",4, function(err,data){
        if (err) {
            // error handling code goes here
            console.log("ERROR : ",err);            
        } else {            
            // code to execute on data retrieval
            console.log("result from db is : ",data);   
        }    

});

*/