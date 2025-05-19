const Grupo = require("../models/grupoModel");

const logger = require('../utils/logger');
const teacherGroupCheckMiddleware = async (req, res, next) => {
  const grupoId =
    req.params.group_id || req.params.grupo_id ||
    req.body.group_id || req.body.grupo_id ||
    req.query.group_id || req.query.grupo_id;

  if (!grupoId) {
    return res.status(400).json({ message: "Se requiere 'grupo_id'" });
  }

  try {
    const grupo = await Grupo.findById(grupoId).lean();

    if (!grupo) {
      logger.warn('Grupo no encontrado', { grupo_id: grupoId });
      return res.status(404).json({ message: "El grupo no existe." });
    }

    const userId = req.user.id;

    if (req.user.rol === "maestro") {
      if (grupo.maestro_id.toString() !== userId.toString()) {
        logger.warn('Acceso denegado: Maestro no autorizado', { usuario_id: userId, grupo_id: grupoId });
        return res.status(403).json({ message: "No tienes permiso sobre este grupo." });
      }
    } else if (req.user.rol === "alumno") {
      const pertenece = grupo.alumnos.some(alumno =>
        alumno.alumno_id?.toString() === userId.toString()
      );
      if (!pertenece) {
        logger.warn('Acceso denegado: Alumno no pertenece al grupo', { usuario_id: userId, grupo_id: grupoId });
        return res.status(403).json({ message: "No perteneces a este grupo." });
      }
    } else {
      logger.warn('Acceso denegado: Rol no autorizado', { usuario_id: userId, grupo_id: grupoId });
      return res.status(403).json({ message: "Rol no autorizado para acceder a grupos." });
    }

    req.grupo = grupo;
    next();
  } catch (error) {
    logger.error('Error al verificar el grupo', { error: error.message });
    return res.status(500).json({ message: "Error al verificar el grupo", error: error.message });
  }
};

module.exports = teacherGroupCheckMiddleware;
