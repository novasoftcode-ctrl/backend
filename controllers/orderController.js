const Order = require('../models/Order');
const Store = require('../models/Store');

// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { productId, storeId, customerName, customerEmail, customerPhone, customerAddress } = req.body;

        const order = new Order({
            product: productId,
            store: storeId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress
        });

        await order.save();
        res.status(201).json({ message: 'Order placed successfully', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get My Orders (for Dashboard)
exports.getMyOrders = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user });
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const orders = await Order.find({ store: store._id }).populate('product');
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
