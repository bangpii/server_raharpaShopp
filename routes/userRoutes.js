// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// @route   POST /api/users/login
// @desc    Login atau register user
// @access  Public
router.post('/login', userController.loginUser);

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

// @route   PUT /api/users/:userId
// @desc    Update user data
// @access  Public
router.put('/:userId', userController.updateUser);

// @route   DELETE /api/users/:userId
// @desc    Delete user
// @access  Public
router.delete('/:userId', userController.deleteUser);

module.exports = router;