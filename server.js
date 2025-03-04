const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const app = express();
const apiRoutes = require("./routes/api");
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

// Serve login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
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

// Use API routes
app.use("/api", apiRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
    
    console.log(`Server running on port ${PORT}`);
});
