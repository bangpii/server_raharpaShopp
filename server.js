require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// CORS untuk frontend Vercel
app.use(cors({
    origin: ["https://raharpa-thrift.vercel.app"],
    credentials: true
}));

app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
    res.json({
        msg: "Backend Connected Successfully! 🎯",
        client: req.headers.origin,
        time: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log("Backend running on port:", PORT);
});