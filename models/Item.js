const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Tersedia', 'Sold Out'],
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

module.exports = mongoose.model('Item', itemSchema);