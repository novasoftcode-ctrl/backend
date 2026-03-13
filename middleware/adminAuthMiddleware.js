const jwt = require('jsonwebtoken');

const adminAuthMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No admin token, authorization denied' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'prismzone_admin_secret';
        const decoded = jwt.verify(token, secret);

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Admin token is not valid' });
    }
};

module.exports = adminAuthMiddleware;
