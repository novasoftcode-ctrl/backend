const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
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
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Store', storeSchema);
