const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

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

// Serve registration page
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

// API for user registration
app.post("/api/register", (req, res) => {
    const { username, password_hash, role } = req.body;
    if (!username || !password_hash || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    db.query(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
        [username, password_hash, role],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "User registered successfully" });
        }
    );
});

// Define API Routes
const createRouter = (tableName) => {
    const router = express.Router();
    
    router.get("/", (req, res) => {
        db.query(`SELECT * FROM ??`, [tableName], (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    });

    router.post("/", (req, res) => {
        const keys = Object.keys(req.body);
        const values = Object.values(req.body);
        if (!keys.length) return res.status(400).json({ error: "No data provided" });
        
        db.query(`INSERT INTO ?? (${keys.map(() => "??").join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
            [tableName, ...keys, ...values], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ message: `${tableName} data inserted` });
            }
        );
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
