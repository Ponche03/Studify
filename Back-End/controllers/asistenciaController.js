const Asistencia = require("../models/asistenciaModel");

// POST /attendance/ - Guardar asistencia
const guardarAsistencia = async (req, res) => {
  try {
    const { grupo_id, fecha, asistencias } = req.body;

    // Crear nueva asistencia
    const nuevaAsistencia = new Asistencia({
      grupo_id,
      fecha,
      asistencias,
    });

    // Guardar en la base de datos
    const asistenciaGuardada = await nuevaAsistencia.save();

    res.status(200).json({
      message: "Asistencia registrada exitosamente",
      attendance: asistenciaGuardada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar la asistencia",
      error: error.message,
    });
  }
};

// GET /attendance/?grupo_id=group_id&fecha=2025-02-10 - Obtener asistencia
const obtenerAsistencia = async (req, res) => {
  try {
    const { grupo_id, fecha } = req.query;

    const targetDate = new Date(fecha);
    if (isNaN(targetDate)) {
      return res.status(400).json({ message: "Fecha inválida" });
    }

    const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

    // Buscar asistencia
    const asistencia = await Asistencia.findOne({
      grupo_id,
      fecha: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!asistencia) {
      return res.status(404).json({
        message: "No se encontró asistencia para el grupo y fecha especificados",
      });
    }

    res.status(200).json({
      message: "Asistencia obtenida exitosamente",
      attendance: asistencia,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la asistencia",
      error: error.message,
    });
  }
};

module.exports = {
  guardarAsistencia,
  obtenerAsistencia,
};