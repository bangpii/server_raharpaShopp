const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Code item harus diisi'],
        trim: true,
        unique: true
    },
    price: {
        type: Number,
        required: [true, 'Harga harus diisi'],
        min: [1, 'Harga harus lebih dari 0']
    },
    image: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: {
            values: ['Tersedia', 'Sold Out'],
            message: 'Status harus Tersedia atau Sold Out'
        },
        default: 'Tersedia'
    },
    date: {
        type: Date,
        default: Date.now
    },
    sentTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    sentAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index untuk performa
itemSchema.index({
    code: 1
});
itemSchema.index({
    status: 1
});
itemSchema.index({
    date: -1
});

module.exports = mongoose.model('Item', itemSchema);