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

    // Buscar asistencia por grupo_id y fecha
    const asistencia = await Asistencia.findOne({ grupo_id, fecha: new Date(fecha) }).populate("asistencias.alumno_id");

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