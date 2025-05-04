const Grupo = require("../models/grupoModel");
const Usuario = require("../models/usuarioModel");
const Tarea = require("../models/tareaModel");
const EntregaTarea = require("../models/tareaModel");
const Asistencia = require("../models/asistenciaModel");


// No Terminado
const obtenerReporteDesempeno = async (req, res) => {
  try {
    const { type } = req.query;

    if (type === "group") {
      // Reporte de desempeño por grupo
      const grupos = await Grupo.find().lean();

      const reportes = await Promise.all(
        grupos.map(async (grupo) => {
          const tareas = await Tarea.find({ grupo_id: grupo._id });
          const entregas = await EntregaTarea.find({ grupo_id: grupo._id });

          const promedioCalificaciones =
            entregas.reduce((acc, entrega) => acc + entrega.calificacion, 0) /
            (entregas.length || 1);

          return {
            grupo: grupo.nombre,
            descripcion: grupo.descripcion,
            promedio_calificaciones: promedioCalificaciones.toFixed(2),
            total_tareas: tareas.length,
            total_entregas: entregas.length,
          };
        })
      );

      return res.status(200).json(reportes);
    } else if (type === "student") {
      // Reporte de desempeño por alumno
      const alumnos = await Usuario.find({ rol: "alumno" }).lean();

      const reportes = await Promise.all(
        alumnos.map(async (alumno) => {
          const entregas = await EntregaTarea.find({ alumno_id: alumno._id });
          const tareas = await Tarea.find({ grupo_id: { $in: alumno.grupos } });

          const promedioCalificaciones =
            entregas.reduce((acc, entrega) => acc + entrega.calificacion, 0) /
            (entregas.length || 1);

          return {
            alumno_id: alumno._id,
            nombre: alumno.nombre,
            promedio_calificaciones: promedioCalificaciones.toFixed(2),
            tareas_entregadas: entregas.length,
            tareas_total: tareas.length,
          };
        })
      );

      return res.status(200).json(reportes);
    } else {
      return res.status(400).json({ message: "Tipo de reporte no válido" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al generar el reporte", error: error.message });
  }
};

// Terminado
const obtenerReporteTareas = async (req, res) => {
  try {
    const { grupo_id, tarea_id, alumno_id, fecha_entrega } = req.query;

    if (!grupo_id) {
      return res.status(400).json({ message: "grupo_id es obligatorio" });
    }

    const filtro = { grupo_id };
    if (tarea_id) filtro._id = tarea_id;
    if (fecha_entrega) {
      filtro.fecha_vencimiento = { $lte: new Date(fecha_entrega) };
    }

    const tareas = await Tarea.find(filtro).lean();

    if (tareas.length === 0) {
      return res.status(404).json({ message: "No se encontraron tareas con los filtros aplicados" });
    }

    const reportePorAlumno = [];

    tareas.forEach(tarea => {
      const fechaVencimiento = tarea.fecha_vencimiento;
      const entregas = tarea.entregas || [];

      const entregasFiltradas = entregas.filter(entrega => {
        const matchAlumno = alumno_id ? entrega.alumno_id?.toString() === alumno_id : true;
        return matchAlumno;
      });

      entregasFiltradas.forEach(entrega => {
        const idAlumno = entrega.alumno_id?.toString();
        if (!idAlumno) return;

        const estado = (entrega.estatus === "Entregado" || entrega.estatus === "Revisado") ? "Entregado" : "Pendiente";
        const entregadaATiempo = entrega.fecha_entrega && entrega.fecha_entrega <= fechaVencimiento;
        const calificacion = typeof entrega.calificacion === "number" ? entrega.calificacion : null;

        reportePorAlumno.push({
          fecha_entrega: fechaVencimiento?.toISOString().split('T')[0] || "",
          nombre_alumno: entrega.nombre_usuario || "Sin nombre",
          nombre_tarea: tarea.titulo || "Sin nombre",
          estado: estado,
          entregada_a_tiempo: entregadaATiempo,
          calificacion: calificacion
        });
      });
    });

    res.status(200).json(reportePorAlumno);
  } catch (error) {
    console.error("Error al obtener el reporte:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};


// Terminado
const obtenerReporteAsistencia = async (req, res) => {
  try {
    const { grupo_id, alumno_id, fecha_inicio, fecha_fin } = req.query;

    if (!grupo_id || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ message: "grupo_id, fecha_inicio y fecha_fin son obligatorios" });
    }

    const grupo = await Grupo.findById(grupo_id).lean();
    if (!grupo) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    const alumnosGrupo = grupo.alumnos.map((a) => a.alumno_id.toString());

    const asistencias = await Asistencia.find({
      grupo_id,
      fecha: { $gte: new Date(fecha_inicio), $lte: new Date(fecha_fin) }
    }).lean();

    const alumnosFiltrados = alumno_id ? [alumno_id] : alumnosGrupo;

    const reporte = await Promise.all(
      alumnosFiltrados.map(async (idAlumno) => {
        const alumnoUsuario = await Usuario.findById(idAlumno).lean();
        if (!alumnoUsuario) return null;

        let totalAsistencias = 0;
        let totalFaltas = 0;

        asistencias.forEach((asistencia) => {
          const registro = asistencia.asistencias.find((a) => a.alumno_id.toString() === idAlumno);
          if (registro) {
            if (registro.presente) totalAsistencias++;
            else totalFaltas++;
          }
        });

        const totalSesiones = totalAsistencias + totalFaltas;
        const porcentajeAsistencia = totalSesiones > 0 ? (totalAsistencias / totalSesiones) * 100 : 0;
        const porcentajeFaltas = 100 - porcentajeAsistencia;

        return {
          nombre: alumnoUsuario.nombre,
          total_asistencias: totalAsistencias,
          total_faltas: totalFaltas,
          porcentaje_asistencia: porcentajeAsistencia.toFixed(2),
          porcentaje_faltas: porcentajeFaltas.toFixed(2)
        };
      })
    );

    res.status(200).json(reporte.filter(Boolean)); // elimina nulls si algún usuario no fue encontrado
  } catch (error) {
    console.error("Error en obtenerReporteAsistencia:", error);
    res.status(500).json({ message: "Error al generar el reporte de asistencia", error: error.message });
  }
};


module.exports = {
  obtenerReporteDesempeno,
  obtenerReporteTareas,
  obtenerReporteAsistencia,
};