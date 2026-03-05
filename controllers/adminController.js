const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeStores = await Store.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Calculate total platform revenue
        let totalRevenue = 0;
        const orders = await Order.find().populate('product', 'price');
        orders.forEach(order => {
            if (order.product && order.product.price) {
                totalRevenue += (order.product.price * order.quantity);
            }
        });

        res.status(200).json({
            totalUsers,
            activeStores,
            totalProducts,
            totalOrders,
            totalRevenue
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getAllStores = async (req, res) => {
    try {
        // Find all stores and populate owner details
        const stores = await Store.find().populate('owner', 'fullName email').lean();

        // Enrich each store with product count, order count, and revenue
        const storeDetails = await Promise.all(stores.map(async (store) => {
            const productCount = await Product.countDocuments({ store: store._id });
            const orderCount = await Order.countDocuments({ store: store._id });

            // Calculate revenue for this specific store
            const storeOrders = await Order.find({ store: store._id, status: { $ne: 'Cancelled' } }).populate('product', 'price');
            let revenue = 0;
            storeOrders.forEach(order => {
                if (order.product && order.product.price) {
                    revenue += (order.product.price * order.quantity);
                }
            });

            return {
                _id: store._id,
                name: store.name,
                ownerName: store.owner?.fullName || 'Unknown',
                ownerEmail: store.owner?.email || 'N/A',
                category: store.category || 'Uncategorized',
                productsCount: productCount,
                ordersCount: orderCount,
                revenue: revenue,
                joinedDate: store.createdAt,
                status: 'Active' // Assuming all stores are active by default as there's no status field
            };
        }));

        res.status(200).json(storeDetails);
    } catch (error) {
        console.error("Error fetching stores:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
