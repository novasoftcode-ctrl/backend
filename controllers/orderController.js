const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');

// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { productId, storeId, customerName, customerEmail, customerPhone, customerAddress, quantity } = req.body;
        const finalQuantity = parseInt(quantity) || 1;

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

        // Notify Store Owner
        const store = await Store.findById(storeId).populate('owner');
        const product = await Product.findById(productId);

        if (store && store.owner) {
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

        if (status === 'Delivered' && order.status !== 'Delivered') {
            const product = await Product.findById(order.product._id);
            if (product) {
                product.stock = Math.max(0, product.stock - (order.quantity || 1));
                await product.save();

                // Low Stock Alert
                if (product.stock < 5) {
                    const store = await Store.findById(order.store).populate('owner');
                    await sendEmail({
                        email: store.email || store.owner.email,
                        subject: `Low Stock Alert: ${product.name}`,
                        message: `The stock for "${product.name}" is low (${product.stock} remaining). Please restock soon.`,
                        html: `<h3>Low Stock Alert</h3><p>Product: <b>${product.name}</b></p><p>Remaining Stock: <b style="color: red;">${product.stock}</b></p>`
                    });
                }
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
