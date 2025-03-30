const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ message: "Acceso denegado. No se proporcionó un token." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Token inválido o expirado." });
    }
};

module.exports = authMiddleware;
