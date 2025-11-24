// controllers/adminController.js
const Admin = require('../models/Admin');

// Login Admin
exports.loginAdmin = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        console.log('🔑 Admin login attempt for:', email);

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email dan password harus diisi'
            });
        }

        // Cari admin berdasarkan email
        const admin = await Admin.findOne({
            email: email.toLowerCase().trim()
        });

        if (!admin) {
            console.log('❌ Admin not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        // Check password (sementara plain text, bisa ditambah bcrypt nanti)
        if (password !== admin.password) {
            console.log('❌ Invalid password for admin:', email);
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        console.log('✅ Admin login successful:', admin.name);

        // Response sukses
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                lastLogin: admin.lastLogin
            }
        });

    } catch (error) {
        console.error('❌ Error admin login:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Get admin profile
exports.getAdminProfile = async (req, res) => {
    try {
        const {
            adminId
        } = req.params;

        const admin = await Admin.findById(adminId).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        console.error('Error get admin profile:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Update admin profile
exports.updateAdminProfile = async (req, res) => {
    try {
        const {
            adminId
        } = req.params;
        const {
            name,
            email
        } = req.body;

        // Perbaikan: Gunakan optional chaining yang benar
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.toLowerCase().trim();

        const admin = await Admin.findByIdAndUpdate(
            adminId,
            updateData, {
                new: true
            }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: admin
        });
    } catch (error) {
        console.error('Error update admin profile:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};