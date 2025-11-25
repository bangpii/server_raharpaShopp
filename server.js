// server.js - FIXED dengan Express 4
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS Configuration - DIPERBAIKI
app.use(cors({
    origin: ["https://your-vercel-app.vercel.app", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(express.json());

// Socket.IO setup - DIPERBAIKI
const io = socketIo(server, {
    cors: {
        origin: ["https://your-vercel-app.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// CONNECT MongoDB Atlas
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp")
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// Import routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// ROUTE TEST
app.get("/", (req, res) => {
    res.json({
        message: "Hello World + MongoDB Atlas 🌍",
        status: "Server is running!",
        timestamp: new Date().toISOString(),
        database: "Connected ✅",
        socketIO: "Enabled ✅"
    });
});

// Health check dengan database status
app.get("/health", async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

        res.status(200).json({
            status: "OK",
            database: dbStatus,
            socketIO: "Active",
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || "development"
        });
    } catch (error) {
        res.status(500).json({
            status: "ERROR",
            error: error.message
        });
    }
});

// Socket.IO Connection Handling - UNTUK FEATURE CHAT
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Test event
    socket.emit('welcome', {
        message: 'Connected to Raharpa Shopp Socket.IO server',
        socketId: socket.id,
        timestamp: new Date().toISOString()
    });

    // Join room untuk admin
    socket.on('join-admin-room', (adminId) => {
        socket.join(`admin_${adminId}`);
        console.log(`Admin ${adminId} joined room admin_${adminId}`);

        socket.emit('admin-room-joined', {
            room: `admin_${adminId}`,
            success: true,
            message: 'Admin room joined successfully'
        });
    });

    // Join room untuk user chat
    socket.on('join-user-room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);

        socket.emit('room-joined', {
            room: `user_${userId}`,
            success: true
        });
    });

    // Handle real-time notifications untuk admin
    socket.on('admin-notification', (data) => {
        const {
            adminId,
            message,
            type
        } = data;
        io.to(`admin_${adminId}`).emit('new-notification', {
            message,
            type,
            timestamp: new Date().toISOString()
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
    console.error('🚨 Server Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : error.message
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
    console.log(`✅ CORS enabled for production and development`);
    console.log(`🔌 Socket.IO ready for real-time features`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});