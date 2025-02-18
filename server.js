const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const app = express();
// local storage
const LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');

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

// Serve login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

// geospatail-map
app.get("/geostatic", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "geostatic.html"));
});

// plant_area
app.get("/plant_area", (req, res) =>
    res.sendFile(path.join(__dirname, "views", "plant_area.html"))
);

// Serve registration page
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});
app.get("/plantation-dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "plantation-dashboard.html"));
});
// Redirect root to login page
app.get("/", (req, res) => {
    res.redirect("/login");
});
app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "home.html"));
});
// plant_management
app.get("/plant_management", (req, res) =>
    res.sendFile(path.join(__dirname, "views", "plant_management.html"))
);


// dashboard
app.get("/dashboard", (req, res) =>
    res.sendFile(path.join(__dirname, "views", "dashboard.html"))
);


// API for user registration
app.post("/api/register", async (req, res) => {
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
// api login
app.post("/api/login", (req, res) => {
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

app.get("/api/sensor-trends", (req, res) => {
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

// ✅ API: Get Average Sensor Readings per Plantation (Bar Chart)
app.get("/api/average-sensor", (req, res) => {
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

// ✅ API: Get Alert Distribution (Pie Chart)
app.get("/api/alert-distribution", (req, res) => {
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

// ✅ API: Get Weather & Sensor Data Correlation (Scatter Plot)
app.get("/api/weather-sensor", (req, res) => {
    const sql = `
    SELECT 
        W.timestamp, 
        P.plantation_area, 
        W.temperature AS weather_temp, 
        W.rainfall AS weather_rainfall, 
        S.soil_moisture
    FROM Weather W
    RIGHT JOIN SensorData S ON W.plantation_id = S.plantation_id
    JOIN PlantationArea P ON S.plantation_id = P.id
    WHERE W.timestamp >= NOW() - INTERVAL 7 DAY
    ORDER BY W.timestamp DESC;
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ✅ API: Get Plantation Locations for Map
app.get("/api/plantation-map", (req, res) => {
    const sql = `
    SELECT id, plantation_area, soil_type, water_source_type 
    FROM PlantationArea;
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
app.get("/api/sensordata", (req, res) => {
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
    }
    );
    
    return router;
};

app.get("/api/sensor-data", (req, res) => {
    const query = `
        SELECT 
            P.plantation_area, 
            ROUND(AVG(S.temperature), 2) AS avg_temperature, 
            ROUND(AVG(S.humidity), 2) AS avg_humidity, 
            ROUND(AVG(S.soil_moisture), 2) AS avg_soil_moisture
        FROM SensorData S
        JOIN PlantationArea P ON S.plantation_id = P.id
        GROUP BY P.plantation_area
        ORDER BY avg_soil_moisture DESC
    `;
    db.query(query, (err, results) => {
        if (err) res.status(500).json(err);
        else res.json(results);
    });
});
app.get("/api/alerts", (req, res) => {
    const query = `
        SELECT 
            A.alert_type, 
            COUNT(A.id) AS alert_count
        FROM Alerts A
        GROUP BY A.alert_type
        ORDER BY alert_count DESC
    `;
    db.query(query, (err, results) => {
        if (err) res.status(500).json(err);
        else res.json(results);
    });
});
app.get("/api/plantation-areas", (req, res) => {
    const query = "SELECT id, plantation_area, latitude, longitude, soil_type, water_source_type FROM PlantationArea";
    db.query(query, (err, results) => {
        if (err) res.status(500).json(err);
        else res.json(results);
    });
});


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
