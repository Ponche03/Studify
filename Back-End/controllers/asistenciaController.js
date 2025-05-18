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

const obtenerAsistencia = async (req, res) => {
  try {
    const { grupo_id, fecha, timezone = "UTC" } = req.query;

    if (!fecha || !timezone) {
      return res.status(400).json({ message: "Parámetros 'fecha' y 'timezone' son obligatorios" });
    }

    // Crea una fecha local en la zona horaria especificada
    const localToUTC = (dateStr, timeStr, tz) => {
      const date = new Date(`${dateStr}T${timeStr}:00`);
      const localeString = date.toLocaleString("en-US", { timeZone: tz });
      const adjusted = new Date(localeString);
      const diffMs = date.getTime() - adjusted.getTime();
      return new Date(date.getTime() + diffMs);
    };

    const fechaInicioUTC = localToUTC(fecha, "00:00", timezone);
    const fechaFinUTC = localToUTC(fecha, "23:59", timezone);

    const asistencia = await Asistencia.findOne({
      grupo_id,
      fecha: {
        $gte: fechaInicioUTC,
        $lte: fechaFinUTC,
      },
    }).lean();

    if (!asistencia) {
      return res.status(404).json({
        notFound: true,
        message: "No se encontró asistencia para el grupo y fecha especificados",
      });
    }

    // Convertir la fecha de la asistencia al formato local "yyyy-mm-dd"
    const fechaLocal = new Date(asistencia.fecha).toLocaleDateString("en-CA", {
      timeZone: timezone,
    });

    asistencia.fecha_local = fechaLocal; // yyyy-mm-dd

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