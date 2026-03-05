const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const sendEmail = require('../utils/sendEmail');


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
                status: store.status || 'Active'
            };
        }));

        res.status(200).json(storeDetails);
    } catch (error) {
        console.error("Error fetching stores:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.updateStoreStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Active', 'Disabled'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const store = await Store.findByIdAndUpdate(id, { status }, { new: true });
        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }

        res.status(200).json({ message: `Store status updated to ${status}`, store });
    } catch (error) {
        console.error("Error updating store status:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getStoresPaymentDue = async (req, res) => {
    try {
        const stores = await Store.find({ status: 'Active' }).populate('owner', 'fullName email').lean();

        const dueStores = stores.filter(store => {
            const createdAt = new Date(store.createdAt);
            const now = new Date();

            // Calculate difference in days
            const diffTime = Math.abs(now - createdAt);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Checking if remainder when divided by 30 is 27 (meaning 3 days left to hit next 30-day mark)
            return (diffDays % 30) === 27;
        });

        const storeDetails = dueStores.map(store => ({
            _id: store._id,
            name: store.name,
            ownerName: store.owner?.fullName || 'Unknown',
            ownerEmail: store.owner?.email || 'N/A',
            joinedDate: store.createdAt,
            daysActive: Math.floor(Math.abs(new Date() - new Date(store.createdAt)) / (1000 * 60 * 60 * 24))
        }));

        res.status(200).json(storeDetails);
    } catch (error) {
        console.error("Error fetching payment due stores:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.sendPaymentReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const store = await Store.findById(id).populate('owner');

        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }

        if (!store.owner || !store.owner.email) {
            return res.status(400).json({ message: "Store owner email not found" });
        }

        const emailOptions = {
            email: store.owner.email,
            subject: `Action Required: PrismZone Subscription Payment Due Soon for ${store.name}`,
            message: `Hello ${store.owner.fullName},\n\nYour monthly subscription for your store "${store.name}" on PrismZone is due in 3 days. Please ensure your payment method is up to date to avoid any service interruptions.\n\nThank you for being part of PrismZone!\n\nBest regards,\nThe PrismZone Team`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>PrismZone Subscription Reminder</h2>
                    <p>Hello <strong>${store.owner.fullName}</strong>,</p>
                    <p>Your monthly subscription for your store <strong>"${store.name}"</strong> on PrismZone is due in <strong>3 days</strong>.</p>
                    <p>Please ensure your payment is made to avoid any service interruptions.</p>
                    <br/>
                    <p>Thank you for being part of PrismZone!</p>
                    <p>Best regards,<br/>The PrismZone Team</p>
                </div>
            `
        };

        await sendEmail(emailOptions);

        res.status(200).json({ message: `Payment reminder email sent successfully to ${store.owner.email}` });
    } catch (error) {
        console.error("Error sending payment reminder:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
