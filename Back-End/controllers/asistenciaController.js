const Asistencia = require("../models/asistenciaModel");
const Grupo = require("../models/grupoModel");
const mongoose = require("mongoose");
const guardarAsistencia = async (req, res) => {
  try {
    const { grupo_id, fecha, asistencias } = req.body;
    const usuarioActivo = req.user;

    // Validación de parámetros
    if (!grupo_id || !fecha || !Array.isArray(asistencias)) {
      return res.status(400).json({
        message: "Faltan parámetros obligatorios o son inválidos: grupo_id, fecha, asistencias.",
      });
    }

    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        message: "La fecha proporcionada no es válida.",
      });
    }

    // Validación de rol
    if (usuarioActivo.rol !== "maestro") {
      return res.status(403).json({
        message: "Permiso denegado. Solo los maestros pueden registrar asistencia.",
      });
    }

    // Validación de pertenencia al grupo
    const grupo = await Grupo.findById(grupo_id);
    if (!grupo) {
      return res.status(404).json({ message: "El grupo no existe." });
    }

    if (!grupo.maestro_id.equals(usuarioActivo.id)) {
      return res.status(403).json({
        message: "No tienes permiso para registrar asistencia para este grupo.",
      });
    }

    // Verificar si ya hay asistencia registrada para ese grupo y fecha
    const inicioDiaUTC = new Date(Date.UTC(
      fechaObj.getUTCFullYear(),
      fechaObj.getUTCMonth(),
      fechaObj.getUTCDate(),
      0, 0, 0, 0
    ));
    const finDiaUTC = new Date(Date.UTC(
      fechaObj.getUTCFullYear(),
      fechaObj.getUTCMonth(),
      fechaObj.getUTCDate(),
      23, 59, 59, 999
    ));

    const existente = await Asistencia.findOne({
      grupo_id: new mongoose.Types.ObjectId(grupo_id),
      fecha: { $gte: inicioDiaUTC, $lte: finDiaUTC },
    });

    if (existente) {
      return res.status(409).json({
        message: "Ya existe una asistencia registrada para este grupo en esta fecha.",
      });
    }

    // Crear y guardar la nueva asistencia
    const nuevaAsistencia = new Asistencia({
      grupo_id,
      fecha,
      asistencias,
    });

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
    const usuarioActivo = req.user;
    if (!grupo_id || !fecha || !timezone) {
      return res.status(400).json({ message: "Parámetros 'grupo_id', 'fecha' y 'timezone' son obligatorios" });
    }

    const grupo = await Grupo.findById(grupo_id).lean();
    if (!grupo) {
      return res.status(404).json({ message: "El grupo no existe." });
    }

    const esMaestroDelGrupo = grupo.maestro_id.toString() === usuarioActivo.id.toString();
    if (!esMaestroDelGrupo) {
      return res.status(403).json({
        message: "No tienes permiso para consultar la asistencia de este grupo.",
      });
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