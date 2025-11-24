// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    date: {
        type: Date,
        default: Date.now
    },
    loginstatus: {
        type: Boolean,
        default: true
    },
    lastlogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastlogin sebelum save - PERBAIKI INI
userSchema.pre('save', function(next) {
    if (this.isModified('loginstatus') && this.loginstatus === true) {
        this.lastlogin = new Date();
    }
    next();
});

// Hapus middleware yang bermasalah jika ada
// userSchema.pre('save', function(next) {
//     this.lastlogin = new Date();
//     next();
// });

module.exports = mongoose.model('User', userSchema);