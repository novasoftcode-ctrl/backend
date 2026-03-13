const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSettingsSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        default: 'novasoftcode@gmail.com'
    },
    password: {
        type: String,
        required: true
    },
    facebookUrl: { type: String, default: '#' },
    instagramUrl: { type: String, default: '#' },
    linkedinUrl: { type: String, default: '#' },
    contactEmail: { type: String, default: 'info@peima.punjab.gov.pk' },
    phone: { type: String, default: '(042) 99232040' },
    address: { type: String, default: '50 Babar Block Garden Town, Lahore' }
}, { timestamps: true });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
