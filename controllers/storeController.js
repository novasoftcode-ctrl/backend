const Store = require('../models/Store');

exports.createStore = async (req, res) => {
    console.log("Store Create Attempt - Body:", req.body);
    console.log("Store Create Attempt - Files:", req.files);
    try {
        const { name, category, description, address, phone, email, officeHours, socialMedia } = req.body;

        const existingStore = await Store.findOne({ name });
        if (existingStore) {
            return res.status(400).json({ message: 'Store name already taken' });
        }

        if (!req.files || !req.files.logo || !req.files.cover) {
            return res.status(400).json({ message: 'Please upload both logo and cover images' });
        }

        const logoUrl = req.files.logo[0].path;
        const coverUrl = req.files.cover[0].path;

        const store = new Store({
            name,
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
        // Convert slug "my-store-name" back to "My Store Name" for searching
        // Or better, use a regex or just match with slugified names in DB if we had a slug field.
        // For now, we'll try to match the name case-insensitively with spaces.
        const nameQuery = slug.replace(/-/g, ' ');
        const store = await Store.findOne({ name: new RegExp('^' + nameQuery + '$', 'i') });

        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        res.status(200).json(store);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
