const Product = require('../models/Product');
const Store = require('../models/Store');

// Create Product
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, comparePrice, sku, stock, category, variants } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Product image is required' });
        }

        // Always find the most recent store for this owner to maintain sync
        const store = await Store.findOne({ owner: req.user }).sort({ createdAt: -1 });
        if (!store) {
            return res.status(404).json({ message: 'Store not found for this user. Please create one first.' });
        }

        console.log(`[Backend] Creating product for store: "${store.name}" (${store._id})`);

        const product = new Product({
            name,
            description,
            price,
            comparePrice,
            sku,
            stock,
            category,
            imageUrl: req.file.path,
            store: store._id,
            variants: variants ? JSON.parse(variants) : []
        });

        await product.save();
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Store Products (by Store Slug - Public)
exports.getStoreProducts = async (req, res) => {
    try {
        const { slug } = req.params;
        const normalizedSlug = slug ? slug.trim().toLowerCase() : "";
        console.log(`[Storefront] Fetching products for slug: "${normalizedSlug}"`);

        const store = await Store.findOne({ slug: normalizedSlug });

        if (!store) {
            console.log(`[Storefront] ERROR: Store not found for slug: "${normalizedSlug}"`);
            return res.status(404).json({ message: 'Store not found' });
        }

        console.log(`[Storefront] SUCCESS: Found store "${store.name}" (${store._id}). Listing products...`);
        const products = await Product.find({ store: store._id }).sort({ createdAt: -1 });
        console.log(`[Storefront] SUCCESS: Found ${products.length} products for store ${store._id}`);

        res.status(200).json(products);
    } catch (err) {
        console.error("[Storefront] CRITICAL ERROR in getStoreProducts:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get My Products (for Dashboard)
exports.getMyProducts = async (req, res) => {
    try {
        const stores = await Store.find({ owner: req.user });
        if (!stores || stores.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const storeIds = stores.map(s => s._id);
        const products = await Product.find({ store: { $in: storeIds } });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (req.file) {
            updateData.imageUrl = req.file.path;
        }

        if (updateData.variants) {
            updateData.variants = JSON.parse(updateData.variants);
        }

        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Single Product (Public)
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('store');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
