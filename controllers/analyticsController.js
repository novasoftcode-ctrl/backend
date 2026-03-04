const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');

// Get Store Analytics
exports.getStoreAnalytics = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user });
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const orders = await Order.find({ store: store._id }).populate('product');

        // Revenue: Total of (price * quantity) for Delivered orders
        const revenue = orders
            .filter(o => o.status === 'Delivered' && o.product)
            .reduce((total, o) => total + ((o.product.price || 0) * (o.quantity || 1)), 0);

        // Monthly Data (Last 12 months or Jan-Dec of current year)
        const currentYear = new Date().getFullYear();
        const monthlyOrders = Array(12).fill(0);
        const monthlyRevenue = Array(12).fill(0);

        orders.forEach(o => {
            if (o.status === 'Delivered') {
                const date = new Date(o.createdAt);
                if (date.getFullYear() === currentYear) {
                    const month = date.getMonth();
                    monthlyOrders[month]++;
                    if (o.product) {
                        monthlyRevenue[month] += (o.product.price * (o.quantity || 1));
                    }
                }
            }
        });

        res.status(200).json({
            revenue,
            totalOrders: orders.length,
            deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
            visitors: store.visitors || 0,
            monthlyOrders,
            monthlyRevenue
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Store Customers
exports.getStoreCustomers = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user });
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const orders = await Order.find({ store: store._id });

        // Get unique customers by email
        const customersMap = new Map();
        orders.forEach(o => {
            if (!customersMap.has(o.customerEmail)) {
                customersMap.set(o.customerEmail, {
                    name: o.customerName,
                    email: o.customerEmail,
                    phone: o.customerPhone,
                    totalSpent: 0,
                    ordersCount: 0,
                    joined: o.createdAt
                });
            }
            const cust = customersMap.get(o.customerEmail);
            cust.ordersCount++;
            // Note: In a real scenario, we'd sum up order totals here
        });

        res.status(200).json(Array.from(customersMap.values()));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
