require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS Configuration - PERBAIKI INI
app.use(cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(express.json());

// Socket.IO setup dengan CORS yang benar - PERBAIKI INI
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: false,
        allowedHeaders: ["Content-Type"]
    },
    transports: ['websocket', 'polling'] // TAMBAHKAN INI
});

// CONNECT MongoDB Atlas
mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp")
    .then(() => console.log("🔥 Berhasil connect ke MongoDB Atlas!"))
    .catch((err) => console.error("❌ Gagal connect ke MongoDB:", err));

// Import routes
const userRoutes = require('./routes/userRoutes');

// Use routes
app.use('/api/users', userRoutes);

// ROUTE TEST - PASTIKAN SAMA DENGAN YANG DI EXPECT FRONTEND
app.get("/", (req, res) => {
    console.log("📨 Request from:", req.headers.origin);

    res.json({
        message: "Hello World + MongoDB Atlas 🌍",
        status: "Server is running!",
        timestamp: new Date().toISOString(),
        client: req.headers.origin || "Unknown",
        database: "Connected ✅",
        socketIO: "Enabled ✅"
    });
});

// Health check dengan Socket.IO status
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        socketIO: "Active",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// Socket.IO Connection Handling - PERBAIKI INI
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

    // Handle user login events
    socket.on('user-login', (data) => {
        console.log('User login via socket:', data);
        // Broadcast ke semua client
        io.emit('user-logged-in', data);
    });

    // Handle user logout events
    socket.on('user-logout', (data) => {
        console.log('User logout via socket:', data);
        // Broadcast ke semua client
        io.emit('user-logged-out', data);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Export io untuk digunakan di controller
app.set('io', io);

// RUN SERVER - GUNAKAN PORT YANG SAMA
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`✅ CORS enabled for all domains`);
    console.log(`🔌 Socket.IO ready with transports: websocket, polling`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
});