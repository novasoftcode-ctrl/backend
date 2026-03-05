const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    logoUrl: { type: String, required: true },
    coverUrl: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    officeHours: {
        daysFrom: String,
        daysTo: String,
        timeFrom: String,
        timeTo: String
    },
    socialMedia: {
        instagram: String,
        facebook: String
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notifications: {
        newOrder: { type: Boolean, default: true },
        lowStock: { type: Boolean, default: true },
        newCustomer: { type: Boolean, default: true }
    },
    status: { type: String, default: 'Active', enum: ['Active', 'Disabled'] },
    visitors: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Store', storeSchema);
