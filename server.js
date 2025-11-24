require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// CORS configuration untuk production
app.use(cors({
    origin: [
        "http://localhost:5173", // Vite dev server
        "https://your-frontend-domain.vercel.app" // Ganti dengan domain frontend nanti
    ],
    credentials: true
}));

app.use(express.json());

// CONNECT MongoDB Atlas (Mongoose v9)
mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp")
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// ROUTE TEST
app.get("/", (req, res) => {
    res.json({
        message: "Hello World + MongoDB Atlas 🌍",
        status: "Server is running!",
        timestamp: new Date().toISOString()
    });
});

// Health check route untuk Railway
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        timestamp: new Date().toISOString()
    });
});

// RUN SERVER
const PORT = process.env.PORT || 3333;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
});