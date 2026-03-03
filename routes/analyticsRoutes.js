const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, analyticsController.getStoreAnalytics);
router.get('/customers', authMiddleware, analyticsController.getStoreCustomers);

module.exports = router;
