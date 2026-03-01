require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
mongoose.set('debug', true);
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const storeRoutes = require("./routes/storeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: "*", // Allows all origins for now to fix connectivity issues
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
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
    res.send("PrismZone API is running...");
});

// Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err : {}
    });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB Atlas Connected Successfully");
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Connection Error:", error);
        process.exit(1);
    });