const User = require('../models/User');

// Login atau Register User dengan Socket.IO
exports.loginUser = async (req, res) => {
    try {
        const {
            name
        } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nama harus diisi'
            });
        }

        // Cari user berdasarkan nama (case insensitive)
        let user = await User.findOne({
            name: {
                $regex: new RegExp(`^${name.trim()}$`, 'i')
            }
        });

        const isNewUser = !user;

        if (user) {
            // Update user yang sudah ada
            user.loginstatus = true;
            user.lastlogin = new Date();
            await user.save();
        } else {
            // Buat user baru
            user = new User({
                name: name.trim(),
                loginstatus: true,
                lastlogin: new Date()
            });
            await user.save();
        }

        // Emit socket event untuk real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('user-logged-in', {
                userId: user._id,
                name: user.name,
                isNewUser: isNewUser,
                timestamp: new Date()
            });

            // Broadcast ke semua client tentang update user list
            const allUsers = await User.find().sort({
                lastlogin: -1
            });
            io.emit('users-updated', allUsers);
        }

        res.status(200).json({
            success: true,
            message: isNewUser ? 'User baru berhasil dibuat' : 'Login berhasil',
            data: {
                id: user._id,
                name: user.name,
                date: user.date,
                loginstatus: user.loginstatus,
                lastlogin: user.lastlogin
            }
        });

    } catch (error) {
        console.error('Error login user:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Get semua users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({
            lastlogin: -1
        });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error get users:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Logout user dengan Socket.IO
exports.logoutUser = async (req, res) => {
    try {
        const {
            userId
        } = req.params;

        const user = await User.findByIdAndUpdate(
            userId, {
                loginstatus: false,
                lastlogin: new Date()
            }, {
                new: true
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Emit socket event untuk real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('user-logged-out', {
                userId: user._id,
                name: user.name,
                timestamp: new Date()
            });

            // Broadcast ke semua client tentang update user list
            const allUsers = await User.find().sort({
                lastlogin: -1
            });
            io.emit('users-updated', allUsers);
        }

        res.status(200).json({
            success: true,
            message: 'Logout berhasil',
            data: user
        });

    } catch (error) {
        console.error('Error logout user:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const {
            userId
        } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error get user by id:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};