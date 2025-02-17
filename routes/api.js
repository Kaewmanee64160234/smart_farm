const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "smart_farm",
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL Database");
});

// Define API Routes
const createRouter = (tableName) => {
    const router = express.Router();
    
    router.get("/", (req, res) => {
        db.query(`SELECT * FROM ${tableName}`, (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    });

    router.post("/", (req, res) => {
        const keys = Object.keys(req.body);
        const values = Object.values(req.body);
        const placeholders = keys.map(() => "?").join(", ");
        
        db.query(`INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${placeholders})`, values, (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: `${tableName} data inserted` });
        });
    });
    
    return router;
};

// Register Routes
app.use("/api/weather", createRouter("weather"));
app.use("/api/users", createRouter("users"));
app.use("/api/sensordata", createRouter("sensordata"));
app.use("/api/plantationarea", createRouter("plantationarea"));
app.use("/api/plant", createRouter("plant"));
app.use("/api/alerts", createRouter("alerts"));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
