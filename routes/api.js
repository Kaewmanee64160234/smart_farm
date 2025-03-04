const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const bcrypt = require("bcryptjs");

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "smart_farm",
    port: 3306
});

// API for user registration
router.post("/register", async (req, res) => {
    const { username, password_hash, role } = req.body;
    console.log(req.body);
    
    if (!username || !password_hash || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password_hash, 10);

    db.query(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
        [username, hashedPassword, role],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "User registered successfully" });
        }
    );
});

// API for user login
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({ message: "Login successful", user });
    });
});
// -----------graph data----------------
// API for sensor trends

router.get("/sensor-trends", (req, res) => {
    const sql = `
    SELECT 
        S.timestamp, 
        P.plantation_area, 
        S.temperature, 
        S.humidity, 
        S.soil_moisture
    FROM SensorData S
    JOIN PlantationArea P ON S.plantation_id = P.id
    ORDER BY S.timestamp DESC
    LIMIT 50;
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// API for average sensor readings per plantation
router.get("/average-sensor", (req, res) => {
    const sql = `
    SELECT 
        P.plantation_area, 
        ROUND(AVG(S.temperature), 2) AS avg_temperature, 
        ROUND(AVG(S.humidity), 2) AS avg_humidity, 
        ROUND(AVG(S.soil_moisture), 2) AS avg_soil_moisture
    FROM SensorData S
    JOIN PlantationArea P ON S.plantation_id = P.id
    GROUP BY P.plantation_area
    ORDER BY avg_soil_moisture DESC;
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// API for alert distribution
router.get("/alert-distribution", (req, res) => {
    const sql = `
    SELECT 
        alert_type, 
        COUNT(id) AS alert_count
    FROM Alerts
    GROUP BY alert_type
    ORDER BY alert_count DESC;
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// API for fetching sensor data
router.get("/sensordata", (req, res) => {
    const { plantation_id, date } = req.query;

    // Validate query parameters
    if (!plantation_id || !date) {
        return res.status(400).json({ error: "plantation_id and date are required." });
    }

    const query = `
        SELECT timestamp, temperature, humidity, soil_moisture, rainfall, wind_speed
        FROM SensorData 
        WHERE plantation_id = ? 
        AND DATE(timestamp) = ?
        ORDER BY timestamp DESC
    `;

    db.query(query, [plantation_id, date], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json(results);
    });

    console.log(
        `Executing SQL Query: 
        SELECT timestamp, temperature, humidity, soil_moisture, rainfall, wind_speed
        FROM SensorData 
        WHERE plantation_id = ${db.escape(plantation_id)} 
        AND DATE(timestamp) = ${db.escape(date)}
        ORDER BY timestamp DESC`
    );
});

// Define API Routes
const createRouter = (tableName) => {
    const router = express.Router();
    
    router.get("/", (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        db.query(`SELECT COUNT(*) AS count FROM ??`, [tableName], (err, countResults) => {
            if (err) return res.status(500).json(err);
            const totalItems = countResults[0].count;
            const totalPages = Math.ceil(totalItems / limit);

            db.query(`SELECT * FROM ?? LIMIT ? OFFSET ?`, [tableName, limit, offset], (err, results) => {
                if (err) return res.status(500).json(err);
                res.json({ plants: results, totalPages });
            });
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
        // log query
        console.log(`INSERT INTO ?? (${keys.map(() => "??").join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
            [tableName, ...keys, ...values]);
    });

    // Update data
    router.put("/:id", (req, res) => {
        const id = req.params.id;
        const keys = Object.keys(req.body);
        const values = Object.values(req.body);

        if (!keys.length) return res.status(400).json({ error: "No data provided" });

        db.query(`UPDATE ?? SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE id = ?`,
            [tableName, ...values, id], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ message: `${tableName} data updated` });
            }
        );
        // log query
        console.log(`UPDATE ?? SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE id = ?`,
            [tableName, ...values, id]);
    });

    // Delete data
    router.delete("/:id", (req, res) => {
        const id = req.params.id;
        db.query(`DELETE FROM ?? WHERE id = ?`, [tableName, id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: `${tableName} data deleted` });
        });
        // log qury 
        console.log(`DELETE FROM ?? WHERE id = ?`, [tableName, id]);
    });
    
    return router;
};

// Register Routes
router.use("/weather", createRouter("weather"));
router.use("/users", createRouter("users"));
router.use("/sensordata", createRouter("sensordata"));
router.use("/plantationarea", createRouter("plantationarea"));
router.use("/plant", createRouter("plant"));
router.use("/alerts", createRouter("alerts"));

module.exports = router;
