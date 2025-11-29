const Item = require('../models/Item');

// Get semua items
exports.getAllItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('sentTo', 'name')
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error get items:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};

// Get items by status
exports.getItemsByStatus = async (req, res) => {
    try {
        const {
            status
        } = req.params;
        const items = await Item.find({
                status
            })
            .populate('sentTo', 'name')
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error get items by status:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
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

        console.log('➕ Add item request:', {
            code,
            price,
            image: image ? `Base64 image (${image.length} chars)` : 'No image'
        });

        // Validasi input
        if (!code || !price) {
            return res.status(400).json({
                success: false,
                message: 'Code dan harga harus diisi'
            });
        }

        // Cek apakah code sudah ada
        const existingItem = await Item.findOne({
            code
        });
        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Code item sudah ada'
            });
        }

        const item = new Item({
            code: code.trim(),
            price: parseInt(price),
            image: image || '',
            status: 'Tersedia'
        });

        await item.save();
        await item.populate('sentTo', 'name');

        console.log('✅ Item added successfully:', item.code);

        // Emit socket event untuk real-time update
        try {
            const io = req.app.get('io');
            if (io) {
                const allItems = await Item.find()
                    .populate('sentTo', 'name')
                    .sort({
                        createdAt: -1
                    });

                io.emit('items-updated', allItems);
                io.emit('item-added', {
                    item: item,
                    timestamp: new Date()
                });
            }
        } catch (socketError) {
            console.warn('⚠️ Socket error during add:', socketError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Item berhasil ditambahkan',
            data: item
        });

    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
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

        const item = await Item.findByIdAndUpdate(
            itemId, {
                code: code,
                price: parseInt(price),
                image: image
            }, {
                new: true
            }
        ).populate('sentTo', 'name');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item tidak ditemukan'
            });
        }

        console.log('✅ Item updated successfully:', item.code);

        // Emit socket event untuk real-time update
        try {
            const io = req.app.get('io');
            if (io) {
                const allItems = await Item.find()
                    .populate('sentTo', 'name')
                    .sort({
                        createdAt: -1
                    });

                io.emit('items-updated', allItems);
                io.emit('item-updated', {
                    item: item,
                    timestamp: new Date()
                });
            }
        } catch (socketError) {
            console.warn('⚠️ Socket error during update:', socketError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Item berhasil diupdate',
            data: item
        });

    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
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
                    .populate('sentTo', 'name')
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
        console.error('Error deleting item:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
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

        const item = await Item.findByIdAndUpdate(
            itemId, {
                status: 'Sold Out',
                sentTo: sentTo,
                sentAt: new Date()
            }, {
                new: true
            }
        ).populate('sentTo', 'name');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item tidak ditemukan'
            });
        }

        console.log('✅ Item sent successfully:', item.code);

        // Emit socket event untuk real-time update
        try {
            const io = req.app.get('io');
            if (io) {
                const allItems = await Item.find()
                    .populate('sentTo', 'name')
                    .sort({
                        createdAt: -1
                    });

                io.emit('items-updated', allItems);
                io.emit('item-sent', {
                    item: item,
                    timestamp: new Date()
                });
            }
        } catch (socketError) {
            console.warn('⚠️ Socket error during send:', socketError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Item berhasil dikirim',
            data: item
        });

    } catch (error) {
        console.error('Error sending item:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
};