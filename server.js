require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// SOLUSI: CORS untuk semua Vercel domains
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://raharpa-thrift.vercel.app",
        /\.vercel\.app$/ // Izinkan semua domain Vercel
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

// ATAU lebih simple - untuk testing izinkan semua
// app.use(cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
// }));

app.use(express.json());

// CONNECT MongoDB Atlas
mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp")
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// ROUTE TEST
app.get("/", (req, res) => {
    console.log("📨 Request from:", req.headers.origin);

    res.json({
        message: "Hello World + MongoDB Atlas 🌍",
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

// RUN SERVER
const PORT = process.env.PORT || 3333;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`🌐 Backend URL: https://serverraharpashopp-production.up.railway.app`);
    console.log(`✅ CORS enabled for Vercel domains`);
});