const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', adminController.getDashboardStats);

// GET /api/admin/stores
router.get('/stores', adminController.getAllStores);

module.exports = router;
