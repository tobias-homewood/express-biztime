/** Database setup for BizTime. */
const { Client } = require("pg");
require("dotenv").config();

let DB_URI = process.env.DB_URI;

if (DB_URI === undefined) {
    console.error("No DB_URI found; exiting");
    process.exit(1);
}

let db = new Client({
    connectionString: DB_URI,
});

db.connect();

// test connection
db.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.error("Error connecting to database");
        console.error(err);
    } else {
        console.log("Connected to database");
    }
});

module.exports = db;
