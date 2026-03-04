const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');

// Create Order
exports.createOrder = async (req, res) => {
    console.log("Order Creation Attempt - Body:", req.body);
    try {
        const { productId, storeId, customerName, customerEmail, customerPhone, customerAddress, quantity } = req.body;

        if (!storeId) {
            console.error("Order Creation Failed: storeId is missing");
            return res.status(400).json({ message: 'Store ID is required to place an order' });
        }
        const finalQuantity = parseInt(quantity) || 1;

        // Check Product Stock first
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.stock < finalQuantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        const orderId = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

        const order = new Order({
            orderId,
            product: productId,
            store: storeId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            quantity: finalQuantity
        });

        await order.save();

        // Subtract Stock immediately
        product.stock -= finalQuantity;
        await product.save();

        // Notify Store Owner
        const store = await Store.findById(storeId).populate('owner');
        const prefs = store?.notifications || { newOrder: true, newCustomer: true, lowStock: true };

        if (store && store.owner) {
            // 1. New Order Notification
            if (prefs.newOrder) {
                await sendEmail({
                    email: store.email || store.owner.email,
                    subject: `New Order Received - ${orderId}`,
                    message: `You have received a new order for ${finalQuantity}x ${product?.name}. Order ID: ${orderId}. View details on your dashboard.`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #6366f1;">New Order Received</h2>
                            <p>Order ID: <b>${orderId}</b></p>
                            <div style="display: flex; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px;">
                                ${product?.imageUrl ? `<img src="${product.imageUrl}" width="80" height="80" style="object-fit: cover; border-radius: 4px;" />` : ''}
                                <div>
                                    <p style="margin: 0; font-weight: bold;">${product?.name || 'Product'}</p>
                                    <p style="margin: 5px 0 0 0; color: #64748b;">Quantity: ${finalQuantity}</p>
                                </div>
                            </div>
                            <h3 style="margin-top: 20px;">Customer Details:</h3>
                            <p><b>Name:</b> ${customerName}</p>
                            <p><b>Phone:</b> ${customerPhone}</p>
                            <p><b>Address:</b> ${customerAddress}</p>
                        </div>
                    `
                });
            }

            // 2. New Customer Notification (Check if first order for this email at this store)
            if (prefs.newCustomer) {
                const previousOrder = await Order.findOne({ store: storeId, customerEmail: customerEmail, _id: { $ne: order._id } });
                if (!previousOrder) {
                    await sendEmail({
                        email: store.email || store.owner.email,
                        subject: `New Customer! - ${customerName}`,
                        message: `Congratulations! ${customerName} just placed their first order at your store.`,
                        html: `<h3 style="color: #6366f1;">New Customer Alert</h3><p><b>${customerName}</b> (${customerEmail}) has joined your customer list!</p>`
                    });
                }
            }

            // 3. Low Stock Notification (Threshold: 5)
            if (prefs.lowStock && product.stock <= 5) {
                await sendEmail({
                    email: store.email || store.owner.email,
                    subject: `Low Stock Alert: ${product.name}`,
                    message: `Your product "${product.name}" is running low. Current stock: ${product.stock}`,
                    html: `<h3 style="color: #f43f5e;">Low Stock Alert</h3><p>The product <b>${product.name}</b> has only <b>${product.stock}</b> units left in stock.</p>`
                });
            }
        }

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

        const orders = await Order.find({ store: store._id }).populate('product').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Order Status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findById(id).populate('product');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If status changing TO Cancelled, return stock
        if (status === 'Cancelled' && order.status !== 'Cancelled') {
            const product = await Product.findById(order.product?._id);
            if (product) {
                product.stock += (order.quantity || 1);
                await product.save();
            }
        }

        // If status WAS Cancelled and is changing BACK to something else, subtract stock
        if (order.status === 'Cancelled' && status !== 'Cancelled') {
            const product = await Product.findById(order.product?._id);
            if (product) {
                product.stock = Math.max(0, product.stock - (order.quantity || 1));
                await product.save();
            }
        }

        // Notify Customer of Status Update
        await sendEmail({
            email: order.customerEmail,
            subject: `Order Status Updated: ${status}`,
            message: `Your order ${order.orderId} has been marked as ${status}.`,
            html: `<h3>Order Update</h3><p>Order ID: <b>${order.orderId}</b></p><p>Status: <b style="color: #6366f1;">${status}</b></p>`
        });

        order.status = status;
        await order.save();

        res.status(200).json({ message: `Order marked as ${status}`, order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Track Order (Public)
exports.trackOrders = async (req, res) => {
    try {
        const { identifier } = req.params; // Email or Phone
        const orders = await Order.find({
            $or: [
                { customerEmail: identifier.trim() },
                { customerPhone: identifier.trim() }
            ]
        }).populate('product').sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cancel Order (Public for Customers) - Deletes order and returns stock
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'Delivered') {
            return res.status(400).json({ message: 'Delivered orders cannot be cancelled' });
        }

        // Refund Stock
        const product = await Product.findById(order.product);
        if (product) {
            product.stock += (order.quantity || 1);
            await product.save();
        }

        await Order.findByIdAndDelete(id);

        res.status(200).json({ message: 'Order cancelled and removed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
