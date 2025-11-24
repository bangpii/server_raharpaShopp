// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware untuk validasi input
const validateLoginInput = (req, res, next) => {
    const {
        name
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Nama harus diisi dan berupa string'
        });
    }

    // Trim dan limit length
    req.body.name = name.trim().substring(0, 100);
    next();
};

// @route   POST /api/users/login
// @desc    Login atau register user
// @access  Public
router.post('/login', validateLoginInput, userController.loginUser);

// @route   GET /api/users
// @desc    Get semua users
// @access  Public
router.get('/', userController.getAllUsers);

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Public
router.get('/:userId', userController.getUserById);

// @route   PUT /api/users/logout/:userId
// @desc    Logout user
// @access  Public
router.put('/logout/:userId', userController.logoutUser);

module.exports = router;