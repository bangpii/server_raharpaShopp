// controllers/chatController.js - DIPERBAIKI LENGKAP
const Chat = require('../models/Chat');
const User = require('../models/User');

// Get semua chat untuk admin
exports.getAllChats = async (req, res) => {
    try {
        console.log('📋 Getting all chats for admin');

        const chats = await Chat.find({
                isActive: true
            })
            .sort({
                lastMessageTime: -1
            })
            .populate('userId', 'name loginstatus lastlogin')
            .lean();

        console.log(`📊 Found ${chats.length} chats`);

        // Format response
        const formattedChats = chats.map(chat => {
            const userObj = chat.userId;
            const userId = userObj ? userObj._id : chat.userId;
            const userName = userObj ? userObj.name : chat.userName;
            const loginStatus = userObj ? userObj.loginstatus : false;
            const lastLogin = userObj ? userObj.lastlogin : null;

            return {
                id: chat._id.toString(),
                userId: userId ? userId.toString() : 'unknown',
                name: userName || 'Unknown User',
                lastMessage: chat.lastMessage || 'No messages yet',
                time: formatTime(chat.lastMessageTime),
                unread: chat.unreadCount || 0,
                online: loginStatus || false,
                lastOnline: formatLastOnline(lastLogin)
            };
        });

        res.status(200).json({
            success: true,
            data: formattedChats
        });
    } catch (error) {
        console.error('❌ Error get all chats:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Get atau buat chat untuk user
exports.getOrCreateUserChat = async (req, res) => {
    try {
        const {
            userId
        } = req.params;

        console.log(`👤 Getting/Creating chat for user: ${userId}`);

        if (!userId || userId === 'undefined' || userId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'User ID tidak valid'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log(`❌ User not found: ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        let chat = await Chat.findOne({
                userId
            })
            .populate('userId', 'name email');

        if (!chat) {
            console.log(`🆕 Creating new chat for user: ${user.name}`);
            chat = new Chat({
                userId,
                userName: user.name,
                messages: [{
                    sender: 'admin',
                    message: `Hallo ${user.name}, selamat datang! Ada yang bisa saya bantu?`,
                    timestamp: new Date(),
                    read: false
                }],
                lastMessage: `Hallo ${user.name}, selamat datang! Ada yang bisa saya bantu?`,
                lastMessageTime: new Date(),
                unreadCount: 1
            });
            await chat.save();
            console.log(`✅ New chat created: ${chat._id}`);
        } else {
            console.log(`✅ Existing chat found: ${chat._id} with ${chat.messages.length} messages`);
        }

        const formattedMessages = chat.messages.map(msg => ({
            id: msg._id ? msg._id.toString() : Date.now().toString(),
            sender: msg.sender,
            message: msg.message,
            time: formatTime(msg.timestamp),
            read: msg.read || false
        }));

        res.status(200).json({
            success: true,
            data: {
                chatId: chat._id.toString(),
                userId: chat.userId._id ? chat.userId._id.toString() : chat.userId.toString(),
                userName: chat.userName,
                messages: formattedMessages
            }
        });

    } catch (error) {
        console.error('❌ Error get or create user chat:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Get chat messages
exports.getChatMessages = async (req, res) => {
    try {
        const {
            chatId
        } = req.params;
        const {
            markRead
        } = req.query;

        console.log(`💬 Getting messages for chat: ${chatId}, markRead: ${markRead}`);

        if (!chatId || chatId === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'Chat ID tidak valid'
            });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            console.log(`❌ Chat not found: ${chatId}`);
            return res.status(404).json({
                success: false,
                message: 'Chat tidak ditemukan'
            });
        }

        // Mark messages as read jika dibaca oleh admin
        if (markRead === 'true') {
            console.log(`📖 Marking messages as read for chat: ${chatId}`);

            const unreadMessages = chat.messages.filter(msg =>
                !msg.read && msg.sender === 'user'
            );

            if (unreadMessages.length > 0) {
                unreadMessages.forEach(msg => {
                    msg.read = true;
                });

                chat.unreadCount = 0;
                await chat.save();
                console.log(`✅ Marked ${unreadMessages.length} messages as read`);
            }
        }

        const formattedMessages = chat.messages.map(msg => ({
            id: msg._id ? msg._id.toString() : Date.now().toString(),
            sender: msg.sender,
            message: msg.message,
            time: formatTime(msg.timestamp),
            read: msg.read || false,
            fileUrl: msg.fileUrl || null,
            fileName: msg.fileName || null
        }));

        console.log(`📨 Found ${formattedMessages.length} messages for chat: ${chatId}`);

        res.status(200).json({
            success: true,
            data: {
                chatId: chat._id.toString(),
                userId: chat.userId._id ? chat.userId._id.toString() : chat.userId.toString(),
                userName: chat.userName,
                messages: formattedMessages
            }
        });
    } catch (error) {
        console.error('❌ Error get chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Send message
exports.sendMessage = async (req, res) => {
    try {
        const {
            chatId,
            userId
        } = req.params;
        const {
            message,
            sender,
            fileUrl,
            fileName
        } = req.body;

        console.log(`📤 Sending message - Chat: ${chatId}, User: ${userId}, Sender: ${sender}`);

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Pesan tidak boleh kosong'
            });
        }

        let chat;

        // Cari chat berdasarkan chatId atau userId
        if (chatId && chatId !== 'new' && chatId !== 'undefined') {
            chat = await Chat.findById(chatId);
        }

        if (!chat && userId && userId !== 'undefined') {
            chat = await Chat.findOne({
                userId
            });
        }

        // Jika chat masih tidak ditemukan, buat baru
        if (!chat) {
            console.log(`🆕 Creating new chat for user: ${userId}`);
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User tidak ditemukan'
                });
            }

            chat = new Chat({
                userId,
                userName: user.name,
                messages: []
            });
        }

        // Tambahkan message baru
        const newMessage = {
            sender: sender || 'user',
            message: message.trim(),
            timestamp: new Date(),
            read: sender === 'admin',
            fileUrl: fileUrl || null,
            fileName: fileName || null
        };

        chat.messages.push(newMessage);
        chat.lastMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
        chat.lastMessageTime = new Date();

        // Update unread count
        if (sender === 'user') {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
        } else {
            chat.unreadCount = 0;
        }

        await chat.save();
        console.log(`✅ Message saved to database - Chat: ${chat._id}`);

        // Emit socket event jika tersedia
        const io = req.app.get('io');
        if (io) {
            const messageData = {
                chatId: chat._id.toString(),
                userId: chat.userId._id ? chat.userId._id.toString() : chat.userId.toString(),
                userName: chat.userName,
                message: newMessage.message,
                sender: newMessage.sender,
                timestamp: newMessage.timestamp,
                read: newMessage.read
            };

            console.log(`📨 Emitting socket event for ${newMessage.sender}`);

            if (newMessage.sender === 'user') {
                io.to('admin_room').emit('new-message', messageData);
            } else {
                io.to(`user_${chat.userId}`).emit('new-message', messageData);
            }

            io.to('admin_room').emit('chat-updated', {
                action: 'new-message',
                chatId: chat._id.toString(),
                userId: chat.userId._id ? chat.userId._id.toString() : chat.userId.toString(),
                userName: chat.userName,
                lastMessage: chat.lastMessage,
                unreadCount: chat.unreadCount,
                timestamp: new Date()
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pesan berhasil dikirim',
            data: {
                chatId: chat._id.toString(),
                message: {
                    id: newMessage._id ? newMessage._id.toString() : Date.now().toString(),
                    ...newMessage
                }
            }
        });

    } catch (error) {
        console.error('❌ Error send message:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Update online status - FUNCTION YANG DITAMBAHKAN
exports.updateOnlineStatus = async (req, res) => {
    try {
        const {
            userId
        } = req.params;
        const {
            isOnline,
            userType
        } = req.body;

        console.log(`🟢 Updating online status - User: ${userId}, Type: ${userType}, Online: ${isOnline}`);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID diperlukan'
            });
        }

        // Update status di database user
        await User.findByIdAndUpdate(userId, {
            loginstatus: isOnline,
            lastlogin: isOnline ? new Date() : undefined
        });

        // Update status di chat
        const updateField = userType === 'admin' ? 'adminOnline' : 'userOnline';
        await Chat.updateMany({
            userId: userId
        }, {
            [updateField]: isOnline
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            if (userType === 'user') {
                io.to('admin_room').emit('user-online', {
                    userId: userId,
                    isOnline: isOnline,
                    userType: userType,
                    timestamp: new Date()
                });
            } else {
                io.emit('admin-online', {
                    isOnline: isOnline,
                    timestamp: new Date()
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Status online diperbarui',
            data: {
                userId,
                isOnline,
                userType
            }
        });

    } catch (error) {
        console.error('❌ Error update online status:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Helper functions
function formatTime(date) {
    if (!date) return '';

    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}j`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays}h`;

    return messageDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
    });
}

function formatLastOnline(lastLogin) {
    if (!lastLogin) return 'Belum pernah login';

    const now = new Date();
    const lastOnline = new Date(lastLogin);
    const diffMs = now - lastOnline;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Online';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';

    return `${diffDays} hari lalu`;
}