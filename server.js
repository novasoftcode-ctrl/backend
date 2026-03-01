require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const storeRoutes = require("./routes/storeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Health Check (Very top)
app.get("/", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "PrismZone API is live",
        port: PORT,
        mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

// 2. Robust CORS (Using standard package with explicit settings)
app.use(cors({
    origin: ["https://prism-zone.netlify.app", "http://localhost:5173"], // Allow production and local dev
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// 3. Body Parser
app.use(express.json());

// 4. Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 5. Routes
app.use("/api/auth", authRoutes);
app.use("/api/store", storeRoutes);

// 6. Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});

// 7. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Database Connection
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is missing in environment variables!");
    } else {
        mongoose.connect(process.env.MONGODB_URI)
            .then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
            .catch((error) => {
                console.error("❌ MongoDB Connection Error:", error.message);
                console.error("Check your Railway Variables and MongoDB Network Access.");
            });
    }
});