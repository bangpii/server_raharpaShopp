require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// CORS configuration untuk production - DIPERBAIKI
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://raharpa-thrift.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// CONNECT MongoDB Atlas (Mongoose v9)
mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp")
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// ROUTE TEST - DITAMBAH LOG
app.get("/", (req, res) => {
    console.log("📨 Request received from:", req.headers.origin);
    console.log("👤 User-Agent:", req.headers['user-agent']);

    res.json({
        message: "Hello World + MongoDB Atlas 🌍",
        status: "Server is running!",
        timestamp: new Date().toISOString(),
        client: req.headers.origin || "Unknown"
    });
});

// Health check route untuk Railway - DITAMBAH LOG
app.get("/health", (req, res) => {
    console.log("🩺 Health check requested from:", req.headers.origin);

    res.status(200).json({
        status: "OK",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        timestamp: new Date().toISOString(),
        client: req.headers.origin || "Unknown"
    });
});

// RUN SERVER
const PORT = process.env.PORT || 3333;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`🌐 Accessible at: https://serverraharpashopp-production.up.railway.app`);
    console.log(`🔗 MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});