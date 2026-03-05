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

// GET /api/admin/stores/recent
router.get('/stores/recent', adminController.getRecentStores);

// POST /api/admin/stores/:id/payment-reminder
router.post('/stores/:id/payment-reminder', adminController.sendPaymentReminder);

// DELETE /api/admin/stores/:id
router.delete('/stores/:id', adminController.deleteStore);

module.exports = router;
