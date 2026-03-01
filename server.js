require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
mongoose.set('debug', true);
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const storeRoutes = require("./routes/storeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Robust CORS Middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://prism-zone.netlify.app"); // Explicitly allow frontend
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/store", storeRoutes);

// Health Check
app.get("/", (req, res) => {
    res.json({
        status: "Running",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        time: new Date().toISOString()
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Database Connection
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is missing in environment variables!");
    } else {
        mongoose.connect(process.env.MONGODB_URI)
            .then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
            .catch((error) => {
                console.error("❌ MongoDB Connection Error:", error.message);
                console.error("Make sure your IP is whitelisted (0.0.0.0/0) in MongoDB Atlas.");
            });
    }
});