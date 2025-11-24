const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const resetUserData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Hapus semua data user
        const deleteResult = await User.deleteMany({});
        console.log(`🗑️ Deleted ${deleteResult.deletedCount} users`);

        // Tambah sample data
        const sampleUsers = [{
                name: 'John Doe',
                loginstatus: false,
                lastlogin: new Date('2024-01-15')
            },
            {
                name: 'Jane Smith',
                loginstatus: true,
                lastlogin: new Date()
            },
            {
                name: 'Budi Santoso',
                loginstatus: true,
                lastlogin: new Date()
            }
        ];

        const createdUsers = await User.insertMany(sampleUsers);
        console.log(`✅ Created ${createdUsers.length} sample users`);

        console.log('🎉 User seeder completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeder error:', error);
        process.exit(1);
    }
};

// Jalankan seeder
resetUserData();