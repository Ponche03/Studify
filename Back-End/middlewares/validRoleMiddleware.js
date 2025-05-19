const validRoleMiddleware = (rolPermitido) => {
  return (req, res, next) => {
    if (!req.user || req.user.rol !== rolPermitido) {
      return res.status(403).json({ message: "Acceso restringido, rol no permitido" });
    }
    next();
  };
};

module.exports = validRoleMiddleware;
