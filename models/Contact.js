const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String },
    message: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);
