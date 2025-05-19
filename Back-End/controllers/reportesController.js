const Grupo = require("../models/grupoModel");
const Usuario = require("../models/usuarioModel");
const Tarea = require("../models/tareaModel");
const EntregaTarea = require("../models/tareaModel");
const Asistencia = require("../models/asistenciaModel");


const obtenerReporteDesempeno = async (req, res) => {
  try {
    const { grupo_id, fecha_inicio, fecha_fin } = req.query;
    const maestro_id = req.user.id;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ message: "fecha_inicio y fecha_fin son obligatorios" });
    }

     const usuarioRol = req.user.rol;

    // Verificar que el usuario tiene rol "maestro"
    if (usuarioRol !== "maestro") {
      return res.status(403).json({
        message: "Solo los usuarios con rol 'maestro' pueden calificar entregas.",
      });
    }


    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);

    // Filtro grupos
    const filtroGrupos = {
      maestro_id,
      archivado: false // ← Filtra solo los grupos activos (no archivados)
    };
    if (grupo_id) {
      filtroGrupos._id = grupo_id;
    }


    const grupos = await Grupo.find(filtroGrupos).lean();
    if (grupos.length === 0) {
      return res.status(404).json({ message: "No se encontraron grupos para este usuario." });
    }

    const reportes = [];

    for (const grupo of grupos) {
      const alumnosGrupo = grupo.alumnos.map(a => a.alumno_id.toString());

      // Obtener tareas dentro del rango
      const tareasGrupo = await Tarea.find({
        grupo_id: grupo._id,
        fecha_vencimiento: { $gte: fechaInicio, $lte: fechaFin }
      }).lean();

      let sumaCalificaciones = 0;
      let cantidadCalificaciones = 0;

      tareasGrupo.forEach(tarea => {
        tarea.entregas?.forEach(entrega => {
          if (alumnosGrupo.includes(entrega.alumno_id?.toString()) && typeof entrega.calificacion === 'number') {
            sumaCalificaciones += entrega.calificacion;
            cantidadCalificaciones++;
          }
        });
      });

      const promedioCalificaciones = cantidadCalificaciones > 0
        ? sumaCalificaciones / cantidadCalificaciones
        : 0;

      // Asistencias
      const asistencias = await Asistencia.find({
        grupo_id: grupo._id,
        fecha: { $gte: fechaInicio, $lte: fechaFin }
      }).lean();

      let totalAsistencias = 0;
      let totalSesiones = asistencias.length;

      asistencias.forEach(asistencia => {
        alumnosGrupo.forEach(idAlumno => {
          const registro = asistencia.asistencias.find(a => a.alumno_id.toString() === idAlumno);
          if (registro && registro.presente) totalAsistencias++;
        });
      });

      const promedioAsistencia = totalSesiones > 0 && alumnosGrupo.length > 0
        ? (totalAsistencias / (totalSesiones * alumnosGrupo.length)) * 100
        : 0;

      // Desviación estándar respecto a otros grupos (incluyendo todos)
      const promediosGrupos = [];

      for (const g of grupos) {
        const tareas = await Tarea.find({
          grupo_id: g._id,
          fecha_vencimiento: { $gte: fechaInicio, $lte: fechaFin }
        }).lean();

        let suma = 0, cantidad = 0;
        tareas.forEach(t => {
          t.entregas?.forEach(e => {
            if (typeof e.calificacion === 'number') {
              suma += e.calificacion;
              cantidad++;
            }
          });
        });

        if (cantidad > 0) {
          promediosGrupos.push({ grupo_id: g._id.toString(), promedio: suma / cantidad, nombre: g.nombre });
        }
      }

      const calcularDesviacionEstandar = (valores) => {
        if (valores.length === 0) return 0;
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const varianza = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length;
        return Math.sqrt(varianza);
      };

      const promediosSolo = promediosGrupos.map(pg => pg.promedio);
      const desviacionEstandar = calcularDesviacionEstandar(promediosSolo);

      reportes.push({
        grupo_id: grupo._id.toString(),
        grupo: grupo.nombre,
        fecha_inicio: fechaInicio.toISOString().split('T')[0],
        fecha_fin: fechaFin.toISOString().split('T')[0],
        promedio_general: promedioCalificaciones.toFixed(2),
        promedio_asistencia: promedioAsistencia.toFixed(2),
        promedio_tareas: tareasGrupo.length,
        evaluaciones_realizadas: cantidadCalificaciones,
        desviacion_estandar_vs_otros_grupos: desviacionEstandar.toFixed(2)
      });
    }

    if (grupo_id) {
      // Solo devolver el reporte para el grupo filtrado (en array)
      const reporteGrupo = reportes.filter(r => r.grupo_id === grupo_id);
      return res.status(200).json(reporteGrupo);
    } else {
      // Devolver el reporte general con desviacion_estandar_promedio y grupos
      const desviacion_estandar_promedio = reportes.map(r => ({
        grupo_id: r.grupo_id,
        grupo: r.grupo,
        desviacion_estandar: r.desviacion_estandar_vs_otros_grupos
      }));

      return res.status(200).json({
        desviacion_estandar_promedio,
        grupos: reportes
      });
    }

  } catch (error) {
    console.error("Error en obtenerReporteDesempeno:", error);
    res.status(500).json({ message: "Error al generar el reporte de desempeño", error: error.message });
  }
};


const obtenerReporteTareas = async (req, res) => {
  try {
    const { grupo_id, tarea_id, alumno_id, fecha_inicio, fecha_fin } = req.query;

    if (!grupo_id) {
      return res.status(400).json({ message: "grupo_id es obligatorio" });
    }

    const usuarioRol = req.user.rol;

    // Verificar que el usuario tiene rol "maestro"
    if (usuarioRol !== "maestro") {
      return res.status(403).json({
        message: "Solo los usuarios con rol 'maestro' pueden calificar entregas.",
      });
    }

    // Validar rango de fechas
    let fechaInicio = null;
    let fechaFin = null;
    if (fecha_inicio && fecha_fin) {
      fechaInicio = new Date(fecha_inicio);
      fechaFin = new Date(fecha_fin);
      if (fechaInicio > fechaFin) {
        return res.status(400).json({ message: "La fecha de inicio no puede ser mayor a la fecha de fin." });
      }
    }

    const filtro = { grupo_id };

    // Filtro por tarea específica si se proporciona
    if (tarea_id) filtro._id = tarea_id;

    // Filtro por rango de fechas
    if (fechaInicio && fechaFin) {
      filtro.fecha_vencimiento = {
        $gte: fechaInicio,
        $lte: fechaFin
      };
    }

    const tareas = await Tarea.find(filtro).lean();

    if (tareas.length === 0) {
      return res.status(404).json({ message: "No se encontraron tareas con los filtros aplicados" });
    }

    // Modo detalle si se proporciona alumno_id
    if (alumno_id) {
      const reportePorAlumno = [];

      tareas.forEach(tarea => {
        const fechaVencimiento = tarea.fecha_vencimiento;
        const entregas = tarea.entregas || [];

        const entregasFiltradas = entregas.filter(entrega =>
          entrega.alumno_id?.toString() === alumno_id
        );

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

      return res.status(200).json(reportePorAlumno);
    }

    // Modo resumen por alumno
    const grupo = await Grupo.findById(grupo_id).populate('alumnos.alumno_id', 'nombre').lean();
    if (!grupo) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    const resumenPorAlumno = grupo.alumnos.map(al => {
      const alumnoId = al.alumno_id?._id?.toString();
      const nombre = al.alumno_id?.nombre || "Sin nombre";

      let tareasEntregadas = 0;
      let tareasATiempo = 0;
      let sumaCalificaciones = 0;
      let totalCalificaciones = 0;

      tareas.forEach(tarea => {
        const entrega = (tarea.entregas || []).find(ent => ent.alumno_id?.toString() === alumnoId);

        if (entrega && (entrega.estatus === "Entregado" || entrega.estatus === "Revisado")) {
          tareasEntregadas++;
          if (entrega.fecha_entrega && entrega.fecha_entrega <= tarea.fecha_vencimiento) {
            tareasATiempo++;
          }

          if (typeof entrega.calificacion === "number") {
            sumaCalificaciones += entrega.calificacion;
            totalCalificaciones++;
          }
        }
      });

      const totalTareas = tareas.length;
      const porcentajeEntregadas = totalTareas > 0 ? (tareasATiempo / totalTareas) * 100 : 0;
      const promedioCalificacion = totalCalificaciones > 0 ? (sumaCalificaciones / totalCalificaciones) : null;

      return {
        nombre_alumno: nombre,
        porcentaje_entregadas_a_tiempo: porcentajeEntregadas.toFixed(2) + "%",
        promedio_calificacion: promedioCalificacion !== null ? promedioCalificacion.toFixed(2) : "N/A"
      };
    });

    return res.status(200).json(resumenPorAlumno);

  } catch (error) {
    console.error("Error al obtener el reporte:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};


const obtenerReporteAsistencia = async (req, res) => {
  try {
    const { grupo_id, alumno_id, fecha_inicio, fecha_fin } = req.query;

     const usuarioRol = req.user.rol;

    // Verificar que el usuario tiene rol "maestro"
    if (usuarioRol !== "maestro") {
      return res.status(403).json({
        message: "Solo los usuarios con rol 'maestro' pueden calificar entregas.",
      });
    }


    if (!grupo_id) {
      return res.status(400).json({ message: "grupo_id es obligatorio" });
    }

    const grupo = await Grupo.findById(grupo_id).lean();
    if (!grupo) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    // Convertimos fechas si están presentes
    const fechaInicio = fecha_inicio ? new Date(fecha_inicio) : null;
    const fechaFin = fecha_fin ? new Date(fecha_fin) : null;

    // Validar que fechaInicio no sea mayor a fechaFin
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      return res.status(400).json({ message: "La fecha de inicio no puede ser mayor a la fecha de fin." });
    }

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
        return res.status(404).json({ message: "Alumno no encontrado" });
      }

      const detallePorDia = asistencias.map((asistencia) => {
        const registro = asistencia.asistencias.find((a) => a.alumno_id.toString() === alumno_id);
        const estado = registro ? (registro.presente ? "Asistió" : "Faltó") : "Sin registro";

        return {
          fecha: asistencia.fecha.toISOString().split('T')[0],
          estado
        };
      });

      return res.status(200).json({
        nombre_alumno: alumnoUsuario.nombre,
        detalle_asistencia: detallePorDia
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
          nombre_alumno: alumnoUsuario.nombre,
          porcentaje_asistencia: porcentajeAsistencia.toFixed(2),
          porcentaje_faltas: porcentajeFaltas.toFixed(2),
          total_asistencias: totalAsistencias,
          total_faltas: totalFaltas
        };
      })
    );

    res.status(200).json(reporte.filter(Boolean));
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