require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ✅ FIX: CORS configuration yang lebih komprehensif
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            "http://localhost:5173",
            "https://raharpa-thrift.vercel.app",
            /\.vercel\.app$/
        ];

        if (allowedOrigins.some(pattern => {
                if (pattern instanceof RegExp) {
                    return pattern.test(origin);
                }
                return pattern === origin;
            })) {
            return callback(null, true);
        } else {
            console.log('🚫 Blocked by CORS:', origin);
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]
}));

// ✅ FIX: Handle preflight requests
app.options('*', cors());

app.use(express.json());

// ✅ FIX: Improved MongoDB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// ✅ FIX: Better route logging
app.get("/", (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log("📨 Request received:");
    console.log("   Origin:", req.headers.origin || "No origin");
    console.log("   IP:", clientIP);
    console.log("   User-Agent:", userAgent ? .substring(0, 50) + "...");
    console.log("   Method:", req.method);
    console.log("   Path:", req.path);

    res.json({
        message: "Hello World + MongoDB Atlas 🌍",
        status: "Server is running!",
        timestamp: new Date().toISOString(),
        client: req.headers.origin || "Direct API Call",
        yourIP: clientIP,
        database: "Connected ✅",
        environment: process.env.NODE_ENV || "development"
    });
});

// ✅ FIX: Add more test endpoints
app.get("/api/test", (req, res) => {
    res.json({
        endpoint: "/api/test",
        status: "Working!",
        timestamp: new Date().toISOString()
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime()
    });
});

// ✅ FIX: Error handling middleware
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Domain not allowed',
            yourOrigin: req.headers.origin,
            allowedOrigins: ["raharpa-thrift.vercel.app", "localhost:5173"]
        });
    }
    next(err);
});

// RUN SERVER
const PORT = process.env.PORT || 3333;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`🌐 Backend URL: https://serverraharpashopp-production.up.railway.app`);
    console.log(`✅ CORS enabled for:`);
    console.log(`   - https://raharpa-thrift.vercel.app`);
    console.log(`   - http://localhost:5173`);
    console.log(`   - All *.vercel.app domains`);
});