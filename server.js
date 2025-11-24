require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// CONNECT MongoDB Atlas (Mongoose v9)
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// ROUTE TEST
app.get("/", (req, res) => {
    res.send("Hello World + MongoDB Atlas 🌍");
});

// RUN SERVER
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
});