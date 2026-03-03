const Store = require('../models/Store');

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
        const store = await Store.findOne({ slug: slug.toLowerCase() });

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        res.status(200).json(store);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
