const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/create', authMiddleware, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), storeController.createStore);

router.get('/view/me', authMiddleware, storeController.getVendorStore);
router.get('/explore', storeController.getAllPublicStores);
router.put('/update', authMiddleware, storeController.updateStore);
router.get('/:slug', storeController.getStoreBySlug);

// Payment methods routes
router.get('/payment-methods', authMiddleware, storeController.getPaymentMethods);
router.put('/payment-methods', authMiddleware, storeController.updatePaymentMethods);

module.exports = router;
