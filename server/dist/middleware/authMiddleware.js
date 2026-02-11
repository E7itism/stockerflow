import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach user info to request
        req.user = decoded;
        // Continue to next middleware/controller
        next();
    }
    catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};
// Middleware to check user role
export const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
