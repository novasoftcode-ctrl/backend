const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', adminController.getDashboardStats);

// GET /api/admin/stores
router.get('/stores', adminController.getAllStores);

// PUT /api/admin/stores/:id/status
router.put('/stores/:id/status', adminController.updateStoreStatus);

// GET /api/admin/stores/payment-due
router.get('/stores/payment-due', adminController.getStoresPaymentDue);

// POST /api/admin/stores/:id/payment-reminder
router.post('/stores/:id/payment-reminder', adminController.sendPaymentReminder);

module.exports = router;
