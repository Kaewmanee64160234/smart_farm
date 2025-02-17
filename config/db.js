const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config();

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "smart_farm"
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL Database!");
});

module.exports = db;
