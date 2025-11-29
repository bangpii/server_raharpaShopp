// server.js - Production
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "https://raharpa-shopp.vercel.app";

console.log('🔧 Frontend URL:', FRONTEND_URL);

// CORS Configuration
app.use(cors({
    origin: [
        FRONTEND_URL,
        "http://localhost:5173",
        "https://raharpa-shopp.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]
}));

app.options('*', cors());
app.use(express.json());

// Socket.IO setup
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
const chatRoutes = require('./routes/chatRoutes');
const itemRoutes = require('./routes/itemRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/items', itemRoutes);
app.use('/uploads', express.static('uploads'));

// ROUTE TEST
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

// Health check
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

    // Join user room
    socket.on('join-user-room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined room user_${userId}`);

        // Update status untuk admin
        socket.to('admin_room').emit('user-online', {
            userId: userId,
            isOnline: true,
            timestamp: new Date()
        });
    });

    // Join admin room
    socket.on('join-admin-room', () => {
        socket.join('admin_room');
        console.log('🛠️ Admin joined admin room');

        // Konfirmasi ke admin
        socket.emit('admin-joined', {
            message: 'Berhasil join admin room',
            timestamp: new Date()
        });
    });

    // Join admin room khusus untuk items
    socket.on('join-admin-room-items', () => {
        socket.join('admin_room');
        console.log('📦 Admin joined admin room for items');

        // Konfirmasi ke admin
        socket.emit('admin-joined-items', {
            message: 'Berhasil join admin room untuk items',
            timestamp: new Date()
        });
    });

    // Handle new message
    socket.on('send-message', async (data) => {
        try {
            console.log('📨 Received message via socket:', data);

            const {
                chatId,
                userId,
                message,
                sender
            } = data;

            // Broadcast ke admin room
            socket.to('admin_room').emit('new-message', {
                chatId,
                userId,
                message,
                sender,
                timestamp: new Date(),
                socketId: socket.id
            });

            // Juga kirim ke user specific room
            socket.to(`user_${userId}`).emit('new-message', {
                chatId,
                userId,
                message,
                sender,
                timestamp: new Date(),
                socketId: socket.id
            });

            // Konfirmasi ke pengirim
            socket.emit('message-sent', {
                success: true,
                message: 'Pesan berhasil dikirim',
                timestamp: new Date()
            });

        } catch (error) {
            console.error('❌ Error handling send-message:', error);
            socket.emit('message-error', {
                error: 'Gagal mengirim pesan',
                details: error.message
            });
        }
    });

    // Handle typing indicator
    socket.on('typing-start', (data) => {
        console.log('⌨️ Typing start:', data);
        const {
            userId,
            chatId
        } = data;

        if (userId === 'admin') {
            // Admin typing - kirim ke user
            socket.to(`user_${chatId}`).emit('user-typing', {
                userId: 'admin',
                isTyping: true,
                chatId
            });
        } else {
            // User typing - kirim ke admin
            socket.to('admin_room').emit('user-typing', {
                userId,
                isTyping: true,
                chatId
            });
        }
    });

    socket.on('typing-stop', (data) => {
        console.log('💤 Typing stop:', data);
        const {
            userId,
            chatId
        } = data;

        if (userId === 'admin') {
            // Admin stop typing - kirim ke user
            socket.to(`user_${chatId}`).emit('user-typing', {
                userId: 'admin',
                isTyping: false,
                chatId
            });
        } else {
            // User stop typing - kirim ke admin
            socket.to('admin_room').emit('user-typing', {
                userId,
                isTyping: false,
                chatId
            });
        }
    });

    // Handle item events dari client
    socket.on('item-added', (data) => {
        console.log('➕ Item added via socket:', data);
        // Broadcast ke semua admin
        socket.to('admin_room').emit('item-added', data);

        // Emit items-updated untuk refresh data real-time
        io.emit('items-updated', {
            action: 'added',
            item: data,
            timestamp: new Date()
        });
    });

    socket.on('item-updated', (data) => {
        console.log('✏️ Item updated via socket:', data);
        // Broadcast ke semua admin
        socket.to('admin_room').emit('item-updated', data);

        // Emit items-updated untuk refresh data real-time
        io.emit('items-updated', {
            action: 'updated',
            item: data,
            timestamp: new Date()
        });
    });

    socket.on('item-deleted', (data) => {
        console.log('🗑️ Item deleted via socket:', data);
        // Broadcast ke semua admin
        socket.to('admin_room').emit('item-deleted', data);

        // Emit items-updated untuk refresh data real-time
        io.emit('items-updated', {
            action: 'deleted',
            itemId: data.itemId,
            timestamp: new Date()
        });
    });

    socket.on('item-sent', (data) => {
        console.log('📤 Item sent via socket:', data);
        // Broadcast ke semua admin
        socket.to('admin_room').emit('item-sent', data);

        // Emit items-updated untuk refresh data real-time
        io.emit('items-updated', {
            action: 'sent',
            item: data,
            timestamp: new Date()
        });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
        console.log('❌ User disconnected:', socket.id, 'Reason:', reason);

        // Notify admin tentang user offline
        socket.to('admin_room').emit('user-offline', {
            socketId: socket.id,
            timestamp: new Date()
        });
    });

    // Error handling
    socket.on('error', (error) => {
        console.error('💥 Socket error:', error);
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
        message: 'Route not found',
        path: req.originalUrl
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