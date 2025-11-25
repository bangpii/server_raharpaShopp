// controllers/adminController.js - FIXED
const Admin = require('../models/Admin');
const mongoose = require('mongoose');

// Login Admin - DIPERBAIKI
exports.loginAdmin = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        console.log('🔑 Admin login attempt for:', email);
        console.log('📦 Request body:', req.body);

        // Validasi input lebih ketat
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Email dan password harus diisi'
            });
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Invalid email format:', email);
            return res.status(400).json({
                success: false,
                message: 'Format email tidak valid'
            });
        }

        // Cek koneksi database
        if (mongoose.connection.readyState !== 1) {
            console.log('❌ Database not connected');
            return res.status(500).json({
                success: false,
                message: 'Database tidak terhubung'
            });
        }

        // Cari admin dengan logging lebih detail
        const normalizedEmail = email.toLowerCase().trim();
        console.log('🔍 Searching admin with email:', normalizedEmail);

        const admin = await Admin.findOne({
            email: normalizedEmail
        });

        console.log('📊 Admin found:', admin);

        if (!admin) {
            console.log('❌ Admin not found for email:', normalizedEmail);
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        // Check status aktif
        if (!admin.isActive) {
            console.log('❌ Admin account inactive:', normalizedEmail);
            return res.status(401).json({
                success: false,
                message: 'Akun admin tidak aktif'
            });
        }

        // Check password - TAMBAH VALIDASI KETAT
        console.log('🔐 Password check - Input:', password, 'Stored:', admin.password);

        if (password !== admin.password) {
            console.log('❌ Password mismatch for admin:', normalizedEmail);
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
        console.error('💥 Error admin login:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};