const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', adminAuthMiddleware, adminController.getDashboardStats);

// GET /api/admin/stores
router.get('/stores', adminAuthMiddleware, adminController.getAllStores);

// PUT /api/admin/stores/:id/status
router.put('/stores/:id/status', adminAuthMiddleware, adminController.updateStoreStatus);

// GET /api/admin/stores/payment-due
router.get('/stores/payment-due', adminAuthMiddleware, adminController.getStoresPaymentDue);

// GET /api/admin/stores/recent
router.get('/stores/recent', adminAuthMiddleware, adminController.getRecentStores);

// POST /api/admin/stores/:id/payment-reminder
router.post('/stores/:id/payment-reminder', adminAuthMiddleware, adminController.sendPaymentReminder);

// DELETE /api/admin/stores/:id
router.delete('/stores/:id', adminAuthMiddleware, adminController.deleteStore);

// POST /api/admin/contact - Submit contact form (Public so users can submit)
router.post('/contact', adminController.submitContact);

// GET /api/admin/contacts - Get all contact messages
router.get('/contacts', adminAuthMiddleware, adminController.getAllContacts);

// GET /api/admin/users - Get all registered users
router.get('/users', adminAuthMiddleware, adminController.getAllUsers);

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', adminAuthMiddleware, adminController.deleteUser);

// POST /api/admin/login - Admin login (Public)
router.post('/login', adminController.adminLogin);

// GET /api/admin/settings - Get admin settings (Public for Footer)
router.get('/settings', adminController.getAdminSettings);

// PUT /api/admin/settings - Update admin settings (Protected)
router.put('/settings', adminAuthMiddleware, adminController.updateAdminSettings);

module.exports = router;
