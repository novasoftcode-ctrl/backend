const Store = require('../models/Store');
// Final Sync: 2026-03-05 00:50

exports.createStore = async (req, res) => {
    console.log("Store Create Attempt - Body:", req.body);
    console.log("Store Create Attempt - Files:", req.files);
    try {
        const { name, category, description, address, phone, email, officeHours, socialMedia } = req.body;

        // Case-insensitive name check
        const existingStore = await Store.findOne({ name: { $regex: new RegExp("^" + name.trim() + "$", "i") } });
        if (existingStore) {
            return res.status(400).json({ message: 'Store name already taken' });
        }

        // Check if user already owns a store
        const ownerStore = await Store.findOne({ owner: req.user });
        if (ownerStore) {
            return res.status(400).json({ message: 'You already have a store. Multiple stores are not supported yet.' });
        }

        if (!req.files || !req.files.logo || !req.files.cover) {
            return res.status(400).json({ message: 'Please upload both logo and cover images' });
        }

        const logoUrl = req.files.logo[0].path;
        const coverUrl = req.files.cover[0].path;
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        const store = new Store({
            name,
            slug,
            category,
            description,
            logoUrl,
            coverUrl,
            address,
            phone,
            email,
            officeHours: JSON.parse(officeHours),
            socialMedia: JSON.parse(socialMedia),
            owner: req.user
        });

        await store.save();
        res.status(201).json({ message: 'Store created successfully', store });
    } catch (err) {
        console.error("Store Creation Error:", err);
        res.status(500).json({
            message: err.message || 'Server error',
            stack: err.stack,
            error: err
        });
    }
};

// Get Store by Slug (Public)
exports.getStoreBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const normalizedSlug = slug ? slug.trim().toLowerCase() : "";
        const store = await Store.findOne({ slug: normalizedSlug });

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        res.status(200).json(store);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Current Vendor's Store (Private)
exports.getVendorStore = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user }).populate('owner');
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }
        res.status(200).json(store);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Public Stores for Explore Page
exports.getAllPublicStores = async (req, res) => {
    try {
        const stores = await Store.find({ status: 'Active' })
            .populate('owner', 'fullName')
            .sort({ createdAt: -1 })
            .lean();

        // Count products for each store to display on the public storefront
        const Product = require('../models/Product'); // Ensure it's imported locally here or at the top of controller

        const publicStoreData = await Promise.all(stores.map(async (store) => {
            const productsCount = await Product.countDocuments({ store: store._id, status: 'Active' });

            return {
                _id: store._id,
                name: store.name,
                slug: store.slug || store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                category: store.category,
                coverUrl: store.coverUrl,
                productsCount: productsCount,
                rating: 5.0, // Default rating 
                ownerName: store.owner?.fullName || 'Anonymous'
            };
        }));

        res.status(200).json(publicStoreData);
    } catch (err) {
        console.error("Error fetching public stores:", err);
        res.status(500).json({ message: err.message });
    }
};

// Update Store (Private)
exports.updateStore = async (req, res) => {
    try {
        const { description, address, phone, email } = req.body;
        const store = await Store.findOne({ owner: req.user });

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        if (description !== undefined) store.description = description;
        if (address !== undefined) store.address = address;
        if (phone !== undefined) store.phone = phone;
        if (email !== undefined) store.email = email;
        if (req.body.notifications !== undefined) store.notifications = req.body.notifications;

        await store.save();

        // Return populated object for frontend consistency
        const updatedStore = await Store.findById(store._id).populate('owner');
        res.status(200).json({ message: 'Store updated successfully', store: updatedStore });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
