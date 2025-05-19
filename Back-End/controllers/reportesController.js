const Grupo = require("../models/grupoModel");
const Usuario = require("../models/usuarioModel");
const Tarea = require("../models/tareaModel");
const EntregaTarea = require("../models/tareaModel");
const Asistencia = require("../models/asistenciaModel");

const logger = require('../utils/logger');
const obtenerReporteDesempeno = async (req, res) => {
  try {
    const { grupo_id, fecha_inicio, fecha_fin } = req.query;
    const maestro_id = req.user.id;

    if (!fecha_inicio || !fecha_fin) {
      return res
        .status(400)
        .json({ message: "fecha_inicio y fecha_fin son obligatorios" });
    }

    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);

    // Filtro grupos
    const filtroGrupos = {
      maestro_id,
      archivado: false, // ← Filtra solo los grupos activos (no archivados)
    };
    if (grupo_id) {
      filtroGrupos._id = grupo_id;
    }

    const grupos = await Grupo.find(filtroGrupos).lean();
    if (grupos.length === 0) {
      logger.warn("No se encontraron grupos para el usuario", { usuario_id: maestro_id });
      return res
        .status(404)
        .json({ message: "No se encontraron grupos para este usuario." });
    }

    const reportes = [];

    for (const grupo of grupos) {
      const alumnosGrupo = grupo.alumnos.map((a) => a.alumno_id.toString());

      // Obtener tareas dentro del rango
      const tareasGrupo = await Tarea.find({
        grupo_id: grupo._id,
        fecha_vencimiento: { $gte: fechaInicio, $lte: fechaFin },
      }).lean();

      let sumaCalificaciones = 0;
      let cantidadCalificaciones = 0;

      tareasGrupo.forEach((tarea) => {
        tarea.entregas?.forEach((entrega) => {
          if (
            alumnosGrupo.includes(entrega.alumno_id?.toString()) &&
            typeof entrega.calificacion === "number"
          ) {
            sumaCalificaciones += entrega.calificacion;
            cantidadCalificaciones++;
          }
        });
      });

      const promedioCalificaciones =
        cantidadCalificaciones > 0
          ? sumaCalificaciones / cantidadCalificaciones
          : 0;

      // Asistencias
      const asistencias = await Asistencia.find({
        grupo_id: grupo._id,
        fecha: { $gte: fechaInicio, $lte: fechaFin },
      }).lean();

      let totalAsistencias = 0;
      let totalSesiones = asistencias.length;

      asistencias.forEach((asistencia) => {
        alumnosGrupo.forEach((idAlumno) => {
          const registro = asistencia.asistencias.find(
            (a) => a.alumno_id.toString() === idAlumno
          );
          if (registro && registro.presente) totalAsistencias++;
        });
      });

      const promedioAsistencia =
        totalSesiones > 0 && alumnosGrupo.length > 0
          ? (totalAsistencias / (totalSesiones * alumnosGrupo.length)) * 100
          : 0;

      // Desviación estándar respecto a otros grupos (incluyendo todos)
      const promediosGrupos = [];

      for (const g of grupos) {
        const tareas = await Tarea.find({
          grupo_id: g._id,
          fecha_vencimiento: { $gte: fechaInicio, $lte: fechaFin },
        }).lean();

        let suma = 0,
          cantidad = 0;
        tareas.forEach((t) => {
          t.entregas?.forEach((e) => {
            if (typeof e.calificacion === "number") {
              suma += e.calificacion;
              cantidad++;
            }
          });
        });

        if (cantidad > 0) {
          promediosGrupos.push({
            grupo_id: g._id.toString(),
            promedio: suma / cantidad,
            nombre: g.nombre,
          });
        }
      }

      const calcularDesviacionEstandar = (valores) => {
        if (valores.length === 0) return 0;
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const varianza =
          valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) /
          valores.length;
        return Math.sqrt(varianza);
      };

      const promediosSolo = promediosGrupos.map((pg) => pg.promedio);
      const desviacionEstandar = calcularDesviacionEstandar(promediosSolo);

      reportes.push({
        grupo_id: grupo._id.toString(),
        grupo: grupo.nombre,
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
        promedio_general: promedioCalificaciones.toFixed(2),
        promedio_asistencia: promedioAsistencia.toFixed(2),
        promedio_tareas: tareasGrupo.length,
        evaluaciones_realizadas: cantidadCalificaciones,
        desviacion_estandar_vs_otros_grupos: desviacionEstandar.toFixed(2),
      });
    }

    if (grupo_id) {
      // Solo devolver el reporte para el grupo filtrado (en array)
      const reporteGrupo = reportes.filter((r) => r.grupo_id === grupo_id);
      logger.info("Reporte de desempeño para grupo específico", { grupo_id });
      return res.status(200).json(reporteGrupo);
    } else {
      // Devolver el reporte general con desviacion_estandar_promedio y grupos
      const desviacion_estandar_promedio = reportes.map((r) => ({
        grupo_id: r.grupo_id,
        grupo: r.grupo,
        desviacion_estandar: r.desviacion_estandar_vs_otros_grupos,
      }));
      logger.info("Reporte de desempeño general", { grupos: reportes });
      return res.status(200).json({
        desviacion_estandar_promedio,
        grupos: reportes,
      });
    }
  } catch (error) {
    logger.error("Error al obtener el reporte de desempeño", { error });
    console.error("Error en obtenerReporteDesempeno:", error);
    res
      .status(500)
      .json({
        message: "Error al generar el reporte de desempeño",
        error: error.message,
      });
  }
};


const obtenerReporteTareas = async (req, res) => {
  try {
    const { grupo_id, tarea_id, alumno_id, fecha_inicio, fecha_fin } =
      req.query;

    if (!grupo_id) {
      logger.warn("grupo_id es obligatorio");
      return res.status(400).json({ message: "grupo_id es obligatorio" });
    }

    const filtro = { grupo_id };

    if (tarea_id) filtro._id = tarea_id;

    if (fecha_inicio && fecha_fin) {
      const fechaInicio = new Date(fecha_inicio);
      const fechaFin = new Date(fecha_fin);

      // Ajustar fechaFin al final del día
      fechaFin.setHours(23, 59, 59, 999);

      filtro.fecha_vencimiento = {
        $gte: fechaInicio,
        $lte: fechaFin,
      };
    }

    const tareas = await Tarea.find(filtro).lean();

    if (tareas.length === 0) {
      logger.warn("No se encontraron tareas con los filtros aplicados", { filtro });
      return res
        .status(404)
        .json({
          message: "No se encontraron tareas con los filtros aplicados",
        });
    }

    // MODO DETALLE ALUMNO
    if (alumno_id) {
      const reportePorAlumno = [];

      tareas.forEach((tarea) => {
        const entregas = tarea.entregas || [];
        const entregaAlumno = entregas.find(
          (e) => e.alumno_id?.toString() === alumno_id
        );

        if (entregaAlumno) {
          // Tarea entregada
         const estado = entregaAlumno.estatus || "Pendiente";
          const calificacion =
            typeof entregaAlumno.calificacion === "number"
              ? entregaAlumno.calificacion
              : null;

          reportePorAlumno.push({
            fecha_entrega: entregaAlumno.fecha_entrega
              ? entregaAlumno.fecha_entrega.toISOString().split("T")[0]
              : "",
            nombre_alumno: entregaAlumno.nombre_usuario || "Sin nombre",
            nombre_tarea: tarea.titulo || "Sin nombre",
            estado: estado,
            calificacion: calificacion,
          });
        } else {
          // Tarea no entregada
          reportePorAlumno.push({
            fecha_entrega: "",
            nombre_alumno: "",
            nombre_tarea: tarea.titulo || "Sin nombre",
            estado: "No entregada",
            calificacion: null,
          });
        }
      });
      logger.info("Reporte de tareas por alumno", { grupo_id, alumno_id });
      return res.status(200).json(reportePorAlumno);
    }

    // MODO RESUMEN POR ALUMNO
    const grupo = await Grupo.findById(grupo_id)
      .populate("alumnos.alumno_id", "nombre")
      .lean();
    if (!grupo) {
      logger.warn("Grupo no encontrado", { grupo_id });
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    const resumenPorAlumno = grupo.alumnos.map((al) => {
      const alumnoId = al.alumno_id?._id?.toString();
      const nombre = al.alumno_id?.nombre || "Sin nombre";

      let tareasEntregadas = 0;
      let sumaCalificaciones = 0;
      let totalCalificaciones = 0;

      tareas.forEach((tarea) => {
        const entrega = (tarea.entregas || []).find(
          (ent) => ent.alumno_id?.toString() === alumnoId
        );

        if (
          entrega &&
          (entrega.estatus === "Entregado" || entrega.estatus === "Revisado")
        ) {
          tareasEntregadas++;

          if (typeof entrega.calificacion === "number") {
            sumaCalificaciones += entrega.calificacion;
            totalCalificaciones++;
          }
        }
      });

      const totalTareas = tareas.length;
      const porcentajeEntregadas =
        totalTareas > 0 ? (tareasEntregadas / totalTareas) * 100 : 0;
      const promedioCalificacion =
        totalCalificaciones > 0
          ? sumaCalificaciones / totalCalificaciones
          : null;

          logger.info("Resumen de tareas por alumno", { grupo_id, nombre });
      return {
        nombre_alumno: nombre,
        porcentaje_entregadas_a_tiempo: porcentajeEntregadas.toFixed(2) + "%", // porcentaje_de_entregas
        promedio_calificacion:
          promedioCalificacion !== null
            ? promedioCalificacion.toFixed(2)
            : "N/A",
      };
    });

    logger.info("Resumen de tareas por alumno", { grupo_id });
    return res.status(200).json(resumenPorAlumno);
  } catch (error) {
    logger.error("Error al obtener el reporte", { error: error.message });
    console.error("Error al obtener el reporte:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

const obtenerReporteAsistencia = async (req, res) => {
  try {
    const { grupo_id, alumno_id, fecha_inicio, fecha_fin } = req.query;

    if (!grupo_id) {
      logger.warn("grupo_id es obligatorio");
      return res.status(400).json({ message: "grupo_id es obligatorio" });
    }

    const grupo = await Grupo.findById(grupo_id).lean();
    if (!grupo) {
      logger.warn("Grupo no encontrado", { grupo_id });
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    // Convertimos fechas si están presentes
    const fechaInicio = fecha_inicio ? new Date(fecha_inicio) : null;
    const fechaFin = fecha_fin ? new Date(fecha_fin) : null;

    // Filtramos asistencias por grupo (y por fecha si aplica)
    const filtroAsistencias = { grupo_id };
    if (fechaInicio && fechaFin) {
      filtroAsistencias.fecha = { $gte: fechaInicio, $lte: fechaFin };
    }

    const asistencias = await Asistencia.find(filtroAsistencias).lean();

    // MODO 2: Reporte detallado por alumno y fechas
    if (alumno_id && fechaInicio && fechaFin) {
      const alumnoUsuario = await Usuario.findById(alumno_id).lean();
      if (!alumnoUsuario) {
        logger.warn("Alumno no encontrado", { alumno_id });
        return res.status(404).json({ message: "Alumno no encontrado" });
      }

      const detallePorDia = asistencias.map((asistencia) => {
        const registro = asistencia.asistencias.find(
          (a) => a.alumno_id.toString() === alumno_id
        );
        const estado = registro
          ? registro.presente
            ? "Asistió"
            : "Faltó"
          : "Sin registro";

        return {
          fecha: asistencia.fecha.toISOString().split("T")[0],
          estado,
        };
      });

      logger.info("Reporte de asistencia por alumno", { grupo_id, alumno_id });
      return res.status(200).json({
        nombre_alumno: alumnoUsuario.nombre,
        detalle_asistencia: detallePorDia,
      });
    }

    // MODO 1: Reporte por grupo y alumnos (resumen por alumno)
    const alumnosGrupo = grupo.alumnos.map((a) => a.alumno_id.toString());

    const reporte = await Promise.all(
      alumnosGrupo.map(async (idAlumno) => {
        const alumnoUsuario = await Usuario.findById(idAlumno).lean();
        if (!alumnoUsuario) return null;

        let totalAsistencias = 0;
        let totalFaltas = 0;

        asistencias.forEach((asistencia) => {
          const registro = asistencia.asistencias.find(
            (a) => a.alumno_id.toString() === idAlumno
          );
          if (registro) {
            if (registro.presente) totalAsistencias++;
            else totalFaltas++;
          }
        });

        const totalSesiones = totalAsistencias + totalFaltas;
        const porcentajeAsistencia =
          totalSesiones > 0 ? (totalAsistencias / totalSesiones) * 100 : 0;
        const porcentajeFaltas = 100 - porcentajeAsistencia;
        return {
          nombre_alumno: alumnoUsuario.nombre,
          porcentaje_asistencia: porcentajeAsistencia.toFixed(2),
          porcentaje_faltas: porcentajeFaltas.toFixed(2),
          total_asistencias: totalAsistencias,
          total_faltas: totalFaltas,
        };
      })
    );
    
    logger.info("Reporte de asistencia por grupo", { grupo_id });
    res.status(200).json(reporte.filter(Boolean));
  } catch (error) {
    logger.error("Error en obtenerReporteAsistencia", { error: error.message });
    res
      .status(500)
      .json({
        message: "Error al generar el reporte de asistencia",
        error: error.message,
      });
  }
};

module.exports = {
  obtenerReporteDesempeno,
  obtenerReporteTareas,
  obtenerReporteAsistencia,
};
