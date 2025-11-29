const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// @route   GET /api/items
// @desc    Get semua items
// @access  Public
router.get('/', itemController.getAllItems);

// @route   GET /api/items/status/:status
// @desc    Get items by status
// @access  Public
router.get('/status/:status', itemController.getItemsByStatus);

// @route   POST /api/items
// @desc    Tambah item baru
// @access  Public
router.post('/', itemController.addItem);

// @route   PUT /api/items/:itemId
// @desc    Update item
// @access  Public
router.put('/:itemId', itemController.updateItem);

// @route   DELETE /api/items/:itemId
// @desc    Delete item
// @access  Public
router.delete('/:itemId', itemController.deleteItem);

// @route   PUT /api/items/:itemId/send
// @desc    Send item (ubah status ke Sold Out)
// @access  Public
router.put('/:itemId/send', itemController.sendItem);

module.exports = router;