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
    const { grupo_id, fechaLocal, zonaHoraria } = req.query;

    if (!fechaLocal || isNaN(parseInt(zonaHoraria))) {
      return res.status(400).json({ message: "Parámetros inválidos" });
    }

    const offsetMin = parseInt(zonaHoraria);
    const offsetMs = offsetMin * 60 * 1000;

    const localStart = new Date(`${fechaLocal}T00:00:00`);
    const localEnd = new Date(`${fechaLocal}T23:59:59.999`);

    // Conversion a UTC 
    const startUTC = new Date(localStart.getTime() + offsetMs); 
    const endUTC = new Date(localEnd.getTime() + offsetMs);

    console.log({
      grupo_id, tipo: typeof grupo_id,
      startUTC: startUTC.toISOString(),
      endUTC: endUTC.toISOString()
    });

    const asistencia = await Asistencia.findOne({
      grupo_id,
      fecha: { $gte: startUTC, $lte: endUTC },
    });

    if (!asistencia) {
      return res.status(404).json({
        notFound: true,
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