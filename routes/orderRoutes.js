const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);

module.exports = router;
