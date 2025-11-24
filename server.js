require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS Configuration
app.use(cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(express.json());

// Error handling middleware untuk JSON parsing
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload'
        });
    }
    next();
});

// Socket.IO setup
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: false,
        allowedHeaders: ["Content-Type"]
    },
    transports: ['websocket', 'polling']
});

// CONNECT MongoDB Atlas
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp")
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// Import routes
const userRoutes = require('./routes/userRoutes');

// Use routes
app.use('/api/users', userRoutes);

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

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        socketIO: "Active",
        timestamp: new Date().toISOString()
    });
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Test event
    socket.emit('welcome', {
        message: 'Connected to Socket.IO server',
        socketId: socket.id
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

// Error handling untuk route tidak ditemukan - PERBAIKI INI
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('💥 Global error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// RUN SERVER
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`✅ CORS enabled for all domains`);
    console.log(`🔌 Socket.IO ready`);
    console.log(`🌐 Test URL: http://localhost:${PORT}`);
});