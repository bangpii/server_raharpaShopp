const Item = require('../models/Item');
const mongoose = require('mongoose');

// Get semua items
exports.getAllItems = async (req, res) => {
    try {
        console.log('📦 Fetching all items from database...');

        const items = await Item.find()
            .populate('sentTo', 'name email')
            .sort({
                createdAt: -1
            });

        console.log(`✅ Successfully fetched ${items.length} items`);

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('❌ Error get items:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: process.env.NODE_ENV === 'production' ? {} : error.message
        });
    }
};

// Get items by status
exports.getItemsByStatus = async (req, res) => {
    try {
        const {
            status
        } = req.params;

        console.log(`📦 Fetching items with status: ${status}`);

        // Validasi status
        if (!['Tersedia', 'Sold Out'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status harus Tersedia atau Sold Out'
            });
        }

        const items = await Item.find({
                status
            })
            .populate('sentTo', 'name email')
            .sort({
                createdAt: -1
            });

        console.log(`✅ Successfully fetched ${items.length} ${status} items`);

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('❌ Error get items by status:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: process.env.NODE_ENV === 'production' ? {} : error.message
        });
    }
};

// Tambah item baru
exports.addItem = async (req, res) => {
    try {
        const {
            code,
            price,
            image
        } = req.body;

        console.log('➕ Add item request received:', {
            code,
            price,
            image: image ? `Base64 image (${image.length} chars)` : 'No image'
        });

        // Validasi input lengkap
        if (!code || code.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Code item harus diisi'
            });
        }

        if (!price || isNaN(price) || parseInt(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Harga harus diisi dan lebih dari 0'
            });
        }

        const cleanCode = code.trim();
        const cleanPrice = parseInt(price);

        // Cek apakah code sudah ada
        const existingItem = await Item.findOne({
            code: cleanCode
        });
        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Code item sudah ada'
            });
        }

        // Buat item baru
        const item = new Item({
            code: cleanCode,
            price: cleanPrice,
            image: image || '',
            status: 'Tersedia',
            date: new Date()
        });

        // Simpan ke database
        const savedItem = await item.save();

        // Populate data setelah save
        await savedItem.populate('sentTo', 'name email');

        console.log('✅ Item added successfully:', savedItem.code);

        // Emit socket event untuk real-time update
        try {
            const io = req.app.get('io');
            if (io) {
                // Get semua items terbaru untuk update real-time
                const allItems = await Item.find()
                    .populate('sentTo', 'name email')
                    .sort({
                        createdAt: -1
                    });

                // Emit ke semua client
                io.emit('items-updated', allItems);

                // Emit event khusus untuk item yang ditambahkan
                io.emit('item-added', {
                    item: savedItem,
                    timestamp: new Date()
                });

                console.log('📢 Socket events emitted for new item');
            }
        } catch (socketError) {
            console.warn('⚠️ Socket error during add:', socketError.message);
            // Jangan gagalkan request karena error socket
        }

        res.status(201).json({
            success: true,
            message: 'Item berhasil ditambahkan',
            data: savedItem
        });

    } catch (error) {
        console.error('❌ Error adding item:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Code item sudah ada'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Data tidak valid',
                errors: errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: process.env.NODE_ENV === 'production' ? {} : error.message
        });
    }
};

// Update item
exports.updateItem = async (req, res) => {
    try {
        const {
            itemId
        } = req.params;
        const {
            code,
            price,
            image
        } = req.body;

        console.log('✏️ Update item request:', itemId, {
            code,
            price,
            image: image ? `Base64 image (${image.length} chars)` : 'No image'
        });

        // Validasi ObjectId
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'ID item tidak valid'
            });
        }

        // Validasi input
        if (!code || code.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Code item harus diisi'
            });
        }

        if (!price || isNaN(price) || parseInt(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Harga harus diisi dan lebih dari 0'
            });
        }

        const cleanCode = code.trim();
        const cleanPrice = parseInt(price);

        // Cek apakah item exists
        const existingItem = await Item.findById(itemId);
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Item tidak ditemukan'
            });
        }

        // Cek duplicate code (kecuali untuk item yang sama)
        if (cleanCode !== existingItem.code) {
            const duplicateItem = await Item.findOne({
                code: cleanCode
            });
            if (duplicateItem) {
                return res.status(400).json({
                    success: false,
                    message: 'Code item sudah digunakan oleh item lain'
                });
            }
        }

        // Update item
        const updatedItem = await Item.findByIdAndUpdate(
            itemId, {
                code: cleanCode,
                price: cleanPrice,
                image: image !== undefined ? image : existingItem.image
            }, {
                new: true,
                runValidators: true
            }
        ).populate('sentTo', 'name email');

        console.log('✅ Item updated successfully:', updatedItem.code);

        // Emit socket event untuk real-time update
        try {
            const io = req.app.get('io');
            if (io) {
                const allItems = await Item.find()
                    .populate('sentTo', 'name email')
                    .sort({
                        createdAt: -1
                    });

                io.emit('items-updated', allItems);
                io.emit('item-updated', {
                    item: updatedItem,
                    timestamp: new Date()
                });
            }
        } catch (socketError) {
            console.warn('⚠️ Socket error during update:', socketError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Item berhasil diupdate',
            data: updatedItem
        });

    } catch (error) {
        console.error('❌ Error updating item:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Code item sudah digunakan oleh item lain'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Data tidak valid',
                errors: errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: process.env.NODE_ENV === 'production' ? {} : error.message
        });
    }
};

// Delete item
exports.deleteItem = async (req, res) => {
    try {
        const {
            itemId
        } = req.params;

        console.log('🗑️ Delete item request:', itemId);

        // Validasi ObjectId
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'ID item tidak valid'
            });
        }

        const item = await Item.findByIdAndDelete(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item tidak ditemukan'
            });
        }

        console.log('✅ Item deleted successfully:', item.code);

        // Emit socket event untuk real-time update
        try {
            const io = req.app.get('io');
            if (io) {
                const allItems = await Item.find()
                    .populate('sentTo', 'name email')
                    .sort({
                        createdAt: -1
                    });

                io.emit('items-updated', allItems);
                io.emit('item-deleted', {
                    itemId: itemId,
                    code: item.code,
                    timestamp: new Date()
                });
            }
        } catch (socketError) {
            console.warn('⚠️ Socket error during delete:', socketError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Item berhasil dihapus',
            data: item
        });

    } catch (error) {
        console.error('❌ Error deleting item:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: process.env.NODE_ENV === 'production' ? {} : error.message
        });
    }
};

// Send item (ubah status dari Tersedia ke Sold Out)
exports.sendItem = async (req, res) => {
    try {
        const {
            itemId
        } = req.params;
        const {
            sentTo
        } = req.body;

        console.log('📤 Send item request:', itemId, 'to user:', sentTo);

        // Validasi ObjectId
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'ID item tidak valid'
            });
        }

        // Cek apakah item exists dan status Tersedia
        const existingItem = await Item.findById(itemId);
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Item tidak ditemukan'
            });
        }

        if (existingItem.status !== 'Tersedia') {
            return res.status(400).json({
                success: false,
                message: 'Item sudah tidak tersedia'
            });
        }

        // Update item
        const updatedItem = await Item.findByIdAndUpdate(
            itemId, {
                status: 'Sold Out',
                sentTo: sentTo || null,
                sentAt: new Date()
            }, {
                new: true
            }
        ).populate('sentTo', 'name email');

        console.log('✅ Item sent successfully:', updatedItem.code);

        // Emit socket event untuk real-time update
        try {
            const io = req.app.get('io');
            if (io) {
                const allItems = await Item.find()
                    .populate('sentTo', 'name email')
                    .sort({
                        createdAt: -1
                    });

                io.emit('items-updated', allItems);
                io.emit('item-sent', {
                    item: updatedItem,
                    timestamp: new Date()
                });
            }
        } catch (socketError) {
            console.warn('⚠️ Socket error during send:', socketError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Item berhasil dikirim',
            data: updatedItem
        });

    } catch (error) {
        console.error('❌ Error sending item:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: process.env.NODE_ENV === 'production' ? {} : error.message
        });
    }
};