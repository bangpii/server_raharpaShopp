// models/Chat.js - DIPERBAIKI DENGAN FIELD FILE
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
        enum: ['user', 'admin']
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    fileSize: {
        type: Number,
        default: null
    }
});

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    adminId: {
        type: String,
        default: 'admin'
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    unreadCount: {
        type: Number,
        default: 0
    },
    userOnline: {
        type: Boolean,
        default: false
    },
    adminOnline: {
        type: Boolean,
        default: false
    },
    messages: [messageSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index untuk performa query
chatSchema.index({
    userId: 1
});
chatSchema.index({
    lastMessageTime: -1
});

module.exports = mongoose.model('Chat', chatSchema);