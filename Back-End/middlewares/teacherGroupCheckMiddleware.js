const Grupo = require("../models/grupoModel");

const teacherGroupCheckMiddleware = async (req, res, next) => {
    const grupoId =
        req.params.group_id || req.params.grupo_id ||
        req.body.group_id || req.body.grupo_id ||
        req.query.group_id || req.query.grupo_id;

    if (!grupoId) {
        return res.status(400).json({ message: "Se requiere 'grupo_id'" });
    }


    try {
        if (req.user.rol !== "maestro") {
            return res.status(403).json({ message: "Acceso restringido, rol no permitido" });
        }

        const grupo = await Grupo.findById(grupoId).lean();

        if (!grupo) {
            return res.status(404).json({ message: "El grupo no existe." });
        }

        if (grupo.maestro_id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "No tienes permiso sobre este grupo." });
        }

        req.grupo = grupo;

        next();
    } catch (error) {
        return res.status(500).json({ message: "Error al verificar el grupo", error: error.message });
    }
};

module.exports = teacherGroupCheckMiddleware;
