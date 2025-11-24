// seeders/adminSeed.js - PERBAIKI PATH INI
const mongoose = require('mongoose');
const Admin = require('../models/Admin'); // Tambahkan ../ untuk naik satu folder
require('dotenv').config();

const createAdminAccount = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/raharpashopp");
        console.log('✅ Connected to MongoDB');

        // Hapus admin yang sudah ada (opsional)
        const deleteResult = await Admin.deleteMany({});
        console.log(`🗑️ Deleted ${deleteResult.deletedCount} admin accounts`);

        // Buat admin account
        const adminData = {
            email: 'raharpashopp@gmail.com',
            password: 'raharpashopp',
            name: 'Raharpa Shopp',
            isActive: true
        };

        const admin = new Admin(adminData);
        await admin.save();

        console.log('✅ Admin account created successfully!');
        console.log('📧 Email:', adminData.email);
        console.log('🔑 Password:', adminData.password);
        console.log('👤 Name:', adminData.name);

        process.exit(0);

    } catch (error) {
        console.error('❌ Admin seeder error:', error);
        process.exit(1);
    }
};

// Jalankan seeder
createAdminAccount();