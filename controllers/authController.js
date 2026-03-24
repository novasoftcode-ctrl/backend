const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

exports.signup = async (req, res) => {
    console.log("Signup attempt - Body:", req.body);
    try {
        const { fullName, email, phone, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ fullName, email, phone, password });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user._id, fullName, email } });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({
            message: err.message || 'Server error',
            details: err,
            stack: err.stack
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email } });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found with this email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token and expiry (1 hour)
        user.passwordResetToken = hashedToken;
        user.passwordResetExpiry = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        // Create reset link
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        // Send email
        const mailContent = {
            email: user.email,
            subject: 'Password Reset Link - PrismZone',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                    <p style="color: #666; margin-bottom: 15px;">Hello ${user.fullName},</p>
                    <p style="color: #666; margin-bottom: 20px;">We received a request to reset your password. Click the button below to proceed:</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #5B5BED; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Reset Password</a>
                    <p style="color: #666; margin: 20px 0;">Or copy and paste this link in your browser:</p>
                    <p style="color: #5B5BED; word-break: break-all; margin: 15px 0;">${resetLink}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">PrismZone Support Team</p>
                </div>
            `
        };

        await sendEmail(mailContent);

        res.status(200).json({ message: 'Reset link sent to your email' });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Hash the token to compare with database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetExpiry = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
};

exports.validateResetToken = async (req, res) => {
    try {
        const { token } = req.body;

        // Hash the token to compare with database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        res.status(200).json({ message: 'Token is valid' });
    } catch (err) {
        console.error("Validate Token Error:", err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
};
