require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Dapatkan domain frontend dari environment variable
const FRONTEND_URL = process.env.FRONTEND_URL || "https://raharpashopp.vercel.app/";

console.log('🔧 Frontend URL:', FRONTEND_URL);

// CORS Configuration - Lebih spesifik
app.use(cors({
    origin: [
        FRONTEND_URL,
        "http://localhost:5173",
        "https://raharpashopp.vercel.app/"
    ],
    credentials: true, // Ubah ke true
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Socket.IO setup dengan konfigurasi yang lebih baikk
const io = socketIo(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type"]
    },
    transports: ['websocket', 'polling']
});

// CONNECT MongoDB Atlas
const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp";
mongoose.connect(MONGODB_URI)
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// Import routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// ROUTE TEST dengan info lengkap
app.get("/", (req, res) => {
    res.json({
        message: "Server Raharpa Shopp Production",
        status: "Server is running!",
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? "Connected ✅" : "Disconnected ❌",
        socketIO: "Enabled ✅",
        frontendUrl: FRONTEND_URL,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check yang lebih detail
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        socketIO: "Active",
        timestamp: new Date().toISOString(),
        server: "Railway",
        frontend: FRONTEND_URL
    });
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Test event
    socket.emit('welcome', {
        message: 'Connected to Socket.IO server - Production',
        socketId: socket.id,
        timestamp: new Date().toISOString()
    });

    // Join room berdasarkan user ID
    socket.on('join-user-room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);

        // Konfirmasi ke client
        socket.emit('room-joined', {
            room: `user_${userId}`,
            success: true
        });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    });
});

// Export io untuk digunakan di controller
app.set('io', io);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Server Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : error.stack
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// RUN SERVER
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🎯 Frontend URL: ${FRONTEND_URL}`);
    console.log(`✅ CORS enabled for: ${FRONTEND_URL}`);
    console.log(`🔌 Socket.IO ready`);
});