require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// SOLUSI: Izinkan semua origin untuk production
app.use(cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(express.json());

// CONNECT MongoDB Atlas
mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp")
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// ROUTE TEST - PASTIKAN SAMA DENGAN YANG DI EXPECT FRONTEND
app.get("/", (req, res) => {
    console.log("📨 Request from:", req.headers.origin);

    res.json({
        message: "Hello World + MongoDB Atlas 🌍", // PASTIKAN INI SAMA
        status: "Server is running!",
        timestamp: new Date().toISOString(),
        client: req.headers.origin || "Unknown",
        database: "Connected ✅"
    });
});

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// RUN SERVER - GUNAKAN PORT YANG SAMA
const PORT = process.env.PORT || 8080; // UBAH KE 8080
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`✅ CORS enabled for all domains`);
});