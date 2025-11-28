// routes/chatRoutes.js - DIPERBAIKI
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// @route   GET /api/chat/admin
// @desc    Get semua chat untuk admin
// @access  Public
router.get('/admin', chatController.getAllChats);

// @route   GET /api/chat/user/:userId
// @desc    Get atau buat chat untuk user
// @access  Public
router.get('/user/:userId', chatController.getOrCreateUserChat);

// @route   GET /api/chat/:chatId/messages
// @desc    Get messages dari chat
// @access  Public
router.get('/:chatId/messages', chatController.getChatMessages);

// @route   POST /api/chat/:chatId/send/:userId
// @desc    Send message
// @access  Public
router.post('/:chatId/send/:userId', chatController.sendMessage);

// @route   PUT /api/chat/status/:userId
// @desc    Update online status
// @access  Public
router.put('/status/:userId', chatController.updateOnlineStatus);

// Test route untuk debugging
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Chat routes working!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;