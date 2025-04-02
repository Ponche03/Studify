const Grupo = require("../models/grupoModel");
const Usuario = require("../models/usuarioModel");
const Tarea = require("../models/tareaModel");
const EntregaTarea = require("../models/tareaModel");


// GET /reports/performance - Reportes de desempeño general
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

// GET /reports/tasks - Reportes de tareas y evaluaciones
const obtenerReporteTareas = async (req, res) => {
  try {
    const { type } = req.query;

    if (type === "group") {
      // Listado de tareas entregadas por grupo
      const grupos = await Grupo.find().lean();

      const reportes = await Promise.all(
        grupos.map(async (grupo) => {
          const tareas = await Tarea.find({ grupo_id: grupo._id });

          const tareasReporte = await Promise.all(
            tareas.map(async (tarea) => {
              const entregas = await EntregaTarea.find({ tarea_id: tarea._id });

              const promedioCalificaciones =
                entregas.reduce((acc, entrega) => acc + entrega.calificacion, 0) /
                (entregas.length || 1);

              return {
                titulo: tarea.titulo,
                fecha_vencimiento: tarea.fecha_vencimiento,
                entregas: entregas.length,
                calificacion_promedio: promedioCalificaciones.toFixed(2),
              };
            })
          );

          return {
            grupo: grupo.nombre,
            tareas: tareasReporte,
          };
        })
      );

      return res.status(200).json(reportes);
    } else if (type === "student") {
      // Resumen de desempeño en tareas por alumno
      const alumnos = await Usuario.find({ rol: "alumno" }).lean();

      const reportes = await Promise.all(
        alumnos.map(async (alumno) => {
          const entregas = await EntregaTarea.find({ alumno_id: alumno._id }).populate("tarea_id");

          const tareasReporte = entregas.map((entrega) => ({
            titulo: entrega.tarea_id.titulo,
            calificacion: entrega.calificacion,
            fecha_entrega: entrega.fecha_entrega,
          }));

          return {
            alumno_id: alumno._id,
            nombre: alumno.nombre,
            tareas: tareasReporte,
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

module.exports = {
  obtenerReporteDesempeno,
  obtenerReporteTareas,
};