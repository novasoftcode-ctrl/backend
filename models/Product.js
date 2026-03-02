const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    comparePrice: { type: Number },
    sku: { type: String },
    stock: { type: Number, default: 0 },
    category: { type: String },
    imageUrl: { type: String, required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    variants: [
        {
            size: String,
            color: String
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
