// routes/adminRoutes.js - FIXED
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// @route   POST /api/admin/login
// @desc    Login admin
// @access  Public
router.post('/login', adminController.loginAdmin);

// @route   GET /api/admin/profile/:adminId
// @desc    Get admin profile
// @access  Public
router.get('/profile/:adminId', adminController.getAdminProfile);

// @route   PUT /api/admin/profile/:adminId
// @desc    Update admin profile
// @access  Public
router.put('/profile/:adminId', adminController.updateAdminProfile);

module.exports = router;