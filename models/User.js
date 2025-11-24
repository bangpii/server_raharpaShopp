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

// Update lastlogin sebelum save
userSchema.pre('save', function(next) {
    if (this.isModified('loginstatus') && this.loginstatus) {
        this.lastlogin = new Date();
    }
    next();
});

module.exports = mongoose.model('User', userSchema);