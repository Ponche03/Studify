const mongoose = require("mongoose");
const Tarea = require("../models/tareaModel");
const Grupo = require("../models/grupoModel");
const Usuario = require("../models/usuarioModel");
const fs = require("fs");
const path = require("path");
const logger = require('../utils/logger');
exports.crearTarea = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      fecha_vencimiento,
      archivo,
      tipo_archivo,
      grupo_id,
      puntos_totales,
      estatus,
    } = req.body;

    if (!titulo || !descripcion || !fecha_vencimiento || puntos_totales == null) {
      return res.status(400).json({
        error: "Los campos titulo, descripcion, fecha_vencimiento y puntos_totales son obligatorios y no pueden ser nulos o vacíos.",
      });
    }

    if (archivo && (!tipo_archivo || tipo_archivo.trim() === "")) {
      return res.status(400).json({
        error: "Si se proporciona un archivo, también se debe especificar el tipo de archivo.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(grupo_id)) {
      return res.status(400).json({ error: "ID de grupo no válido" });
    }

    const grupo = await Grupo.findById(grupo_id);
    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    const estatusValido = ["Abierta", "Cerrada"];
    if (estatus && !estatusValido.includes(estatus)) {
      return res.status(400).json({ error: "Estatus no válido" });
    }

    const fechaVencimiento = new Date(fecha_vencimiento);
    if (isNaN(fechaVencimiento.getTime())) {
      return res.status(400).json({ error: "Fecha de vencimiento no válida" });
    }

    // Validar que la fecha de vencimiento sea al menos 1 hora después de la fecha actual
    const ahora = new Date();
    const minimoPermitido = new Date(ahora.getTime() + 60 * 60 * 1000); // +1 hora
    if (fechaVencimiento < minimoPermitido) {
      return res.status(400).json({ error: "La fecha de vencimiento debe ser al menos una hora después de la hora actual." });
    }

    const nuevaTarea = new Tarea({
      titulo,
      descripcion,
      fecha_vencimiento: fechaVencimiento,
      archivo: archivo || null,
      tipo_archivo: tipo_archivo || null,
      grupo_id,
      puntos_totales,
      estatus: estatus || "Abierta",
    });

    await nuevaTarea.save();

    res.status(201).json({
      message: "Tarea creada exitosamente",
      task: nuevaTarea,
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.actualizarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      fecha_vencimiento,
      archivo,
      tipo_archivo,
      puntos_totales,
      group_id
    } = req.body;

    const tarea = await Tarea.findById(id);
    if (!tarea) {
      logger.warn("Tarea no encontrada", { id });
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

if (fecha_vencimiento) {
  const fechaAnterior = new Date(tarea.fecha_vencimiento);
  const fechaNueva = new Date(fecha_vencimiento);

  // Si la nueva fecha es diferente y está en el futuro, reabrir la tarea
  if (fechaNueva.getTime() !== fechaAnterior.getTime() && fechaNueva > new Date()) {
    tarea.fecha_vencimiento = fechaNueva;

    if (tarea.estatus === "Cerrada") {
      tarea.estatus = "Abierta";
    }
  }
}



    if (archivo && (!tipo_archivo || tipo_archivo.trim() === "")) {
      logger.warn("Tipo de archivo no proporcionado", { id });
      return res.status(400).json({
        error: "Si se proporciona un nuevo archivo, también se debe especificar el tipo de archivo.",
      });
    }

    if (titulo !== undefined && titulo.trim() === "") {
      logger.warn("Título vacío", { id });
      return res.status(400).json({ error: "El título no puede estar vacío." });
    }

    if (descripcion !== undefined && descripcion.trim() === "") {
      logger.warn("Descripción vacía", { id });
      return res.status(400).json({ error: "La descripción no puede estar vacía." });
    }

    if (puntos_totales !== undefined && puntos_totales === null) {
      logger.warn("Puntos totales nulos", { id });
      return res.status(400).json({ error: "Los puntos totales no pueden ser nulos." });
    }

    tarea.titulo = titulo !== undefined ? titulo : tarea.titulo;
    tarea.descripcion = descripcion !== undefined ? descripcion : tarea.descripcion;
    tarea.puntos_totales = puntos_totales !== undefined ? puntos_totales : tarea.puntos_totales;
    tarea.estatus = tarea.estatus;
    tarea.archivo = archivo !== undefined ? archivo : tarea.archivo;
    tarea.tipo_archivo = tipo_archivo !== undefined ? tipo_archivo : tarea.tipo_archivo;

    if (fecha_vencimiento) {
      const nuevaFecha = new Date(fecha_vencimiento);
      if (isNaN(nuevaFecha.getTime())) {
        logger.warn("Fecha de vencimiento no válida", { id });
        return res.status(400).json({ error: "Fecha de vencimiento no válida" });
      }

      // Validar que la nueva fecha sea al menos una hora en el futuro
      const ahora = new Date();
      const minimoPermitido = new Date(ahora.getTime() + 60 * 60 * 1000);
      if (nuevaFecha < minimoPermitido) {
        logger.warn("La nueva fecha de vencimiento debe ser al menos una hora después de la hora actual", { id });
        return res.status(400).json({ error: "La nueva fecha de vencimiento debe ser al menos una hora después de la hora actual." });
      }

      tarea.fecha_vencimiento = nuevaFecha;
    }

    await tarea.save();
    logger.info("Tarea actualizada exitosamente", { id });
    res.status(200).json({
      message: "Tarea actualizada exitosamente",
      task: tarea,
    });
  } catch (error) {
    logger.error("Error:", { error: error.message });
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


exports.eliminarTarea = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID de la tarea desde los parámetros de la URL

    // Buscar y eliminar la tarea en la base de datos por su ID
    const tareaEliminada = await Tarea.findByIdAndDelete(id);

    // Verificar si la tarea fue encontrada y eliminada
    if (!tareaEliminada) {
      logger.warn("Tarea no encontrada", { id });
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    logger.info("Tarea eliminada exitosamente", { id });
    // Responder con un mensaje de éxito
    res.status(200).json({
      message: "Tarea eliminada exitosamente.",
    });
  } catch (error) {
    logger.error("Error:", { error: error.message });
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.obtenerTareas = async (req, res) => {
  try {
    const {
      pagina = 1,
      status,
      fecha_inicio,
      fecha_fin,
      group_id,
      orden = "asc",
      titulo,
      limit = 10,
    } = req.query;

    const page = parseInt(pagina);
    const filters = {};
    const userId = req.user.id;
    const userRole = req.user.rol;

    let gruposRelevantes = [];

    if (userRole === "maestro") {
      const grupos = await Grupo.find({ maestro_id: userId }).select("_id");
      gruposRelevantes = grupos.map((g) => g._id.toString());
    } else if (userRole === "alumno") {
      const grupos = await Grupo.find({ "alumnos.alumno_id": userId }).select(
        "_id"
      );
      gruposRelevantes = grupos.map((g) => g._id.toString());
    }

    // Filtrar por grupos relevantes
    filters.grupo_id = { $in: gruposRelevantes };

    if (status) {
      filters.estatus = status;
    }

    if (fecha_inicio && fecha_fin) {
      filters.fecha_vencimiento = {
        $gte: new Date(fecha_inicio),
        $lte: new Date(fecha_fin),
      };
    }

    if (group_id && gruposRelevantes.includes(group_id)) {
      filters.grupo_id = group_id;
    }

    if (titulo) {
      filters.titulo = { $regex: titulo, $options: "i" };
    }


    const pageSize = limit;
    const skip = (page - 1) * pageSize;
    const sortOrder = orden === "desc" ? -1 : 1;

    const tasksRaw = await Tarea.find(filters)
      .populate("grupo_id", "nombre")
      .sort({ fecha_vencimiento: sortOrder })
      .skip(skip)
      .limit(pageSize);

    const tasks = tasksRaw.map((task) => {
      const taskObj = task.toObject();

      delete taskObj.__v;

      taskObj.grupo = taskObj.grupo_id
        ? {
          _id: taskObj.grupo_id._id,
          nombre: taskObj.grupo_id.nombre,
        }
        : null;
      delete taskObj.grupo_id;

      return taskObj;
    });

    const totalTasks = await Tarea.countDocuments(filters);
    const totalPages = Math.ceil(totalTasks / pageSize);
    logger.info("Tareas obtenidas exitosamente", { totalTasks, page, totalPages });
    res.status(200).json({
      total: totalTasks,
      page: page,
      totalPages: totalPages,
      tasks: tasks,
    });
  } catch (error) {
    logger.error("Error al obtener tareas:", { error: error.message });
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.obtenerTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, id: usuarioId } = req.user;

    // Buscar la tarea con información de grupo y entregas
    const tareaRaw = await Tarea.findById(id)
      .populate("grupo_id", "nombre alumnos")
      .populate("entregas.alumno_id", "nombre email foto_perfil");

    if (!tareaRaw) {
      logger.warn("Tarea no encontrada", { id });
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Convertir la tarea a objeto plano y eliminar __v
    const tarea = tareaRaw.toObject();
    delete tarea.__v;

    // Transformar grupo_id → grupo
    tarea.grupo = tarea.grupo_id
      ? {
        _id: tarea.grupo_id._id,
        nombre: tarea.grupo_id.nombre,
      }
      : null;
    delete tarea.grupo_id;

    // Obtener el grupo completo y los alumnos asociados
    const grupo = await Grupo.findById(tarea.grupo._id).lean();

    if (!grupo) {
      logger.warn("Grupo no encontrado", { id: tarea.grupo._id });
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    // Obtener los alumnos usando una consulta explícita en la colección "User"
    const alumnos = await Usuario.find({
      _id: { $in: grupo.alumnos.map((a) => a.alumno_id) },
    });

    // Mapear los alumnos con el número de lista
    const alumnosConNumeroLista = alumnos.map((alumno) => {
      const numeroLista = grupo.alumnos.find(
        (a) => a.alumno_id.toString() === alumno._id.toString()
      ).numero_lista;

      return {
        _id: alumno._id,
        nombre: alumno.nombre,
        email: alumno.email,
        foto_perfil: alumno.foto_perfil,
        numero_lista: numeroLista,
      };
    });

    if (rol === "maestro") {
      // Crear un mapa de entregas de los alumnos usando el _id correcto
      const entregasMap = new Map();
      for (const entrega of tarea.entregas) {
        if (entrega.alumno_id && entrega.alumno_id._id) {
          // Si el alumno fue populado (es un objeto)
          entregasMap.set(entrega.alumno_id._id.toString(), entrega);
        } else if (entrega.alumno_id) {
          // Si solo viene como ObjectId
          entregasMap.set(entrega.alumno_id.toString(), entrega);
        }
      }

      // Mapear las entregas con los alumnos ordenados por número de lista
      tarea.entregas = alumnosConNumeroLista
        .sort((a, b) => a.numero_lista - b.numero_lista)
        .map(({ _id, nombre, foto_perfil, numero_lista }) => {
          const entrega = entregasMap.get(_id.toString());

          if (entrega) {
            const resultado = {
              id: _id,
              nombre_usuario: nombre,
              foto_perfil: foto_perfil || "",
              numero_lista: numero_lista || null,
              archivo_entregado: entrega.archivo_entregado || "",
              tipo_archivo: entrega.tipo_archivo || "",
              fecha_entrega: entrega.fecha_entrega || "",
              estatus: entrega.estatus,
            };

            if (entrega.estatus === "Revisado") {
              resultado.fecha_revision = entrega.fecha_entrega;
              if (entrega.calificacion !== undefined) {
                resultado.calificacion = entrega.calificacion;
              }
            }

            return resultado;
          }

          // Si no hay entrega registrada
          return {
            id: _id,
            nombre_usuario: nombre,
            foto_perfil: foto_perfil || "",
            numero_lista: numero_lista || null,
            archivo_entregado: "",
            tipo_archivo: "",
            fecha_entrega: "",
            estatus: "No entregado",
          };
        });
    } else if (rol === "alumno") {
      // Encontrar la entrega del alumno
      const entrega = tarea.entregas.find(
        (e) =>
          (e.alumno_id && e.alumno_id._id
            ? e.alumno_id._id.toString()
            : e.alumno_id?.toString()) === usuarioId
      );

      tarea.entrega = entrega
        ? {
          nombre_usuario: entrega.alumno_id?.nombre || "",
          archivo_entregado: entrega.archivo_entregado || "",
          tipo_archivo: entrega.tipo_archivo || "",
          fecha_entrega: entrega.fecha_entrega || "",
          estatus: entrega.estatus,
          numero_lista:
            alumnosConNumeroLista.find((a) => a._id.toString() === usuarioId)
              ?.numero_lista || null,
          ...(entrega.estatus === "Revisado"
            ? {
              fecha_revision: entrega.fecha_entrega,
              ...(entrega.calificacion !== undefined
                ? { calificacion: entrega.calificacion }
                : {}),
            }
            : {}),
        }
        : {
          nombre_usuario: "",
          archivo_entregado: "",
          tipo_archivo: "",
          fecha_entrega: "",
          estatus: "No entregado",
          numero_lista: null,
        };

      // Eliminar el campo 'entregas' para el rol de alumno
      delete tarea.entregas;
    }
    logger.info("Tarea obtenida exitosamente", { id });
    res.status(200).json(tarea);
  } catch (error) {
    logger.error("Error al obtener tarea", { error: error.message });
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.calificarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { alumno_id, calificacion } = req.body;

    if (!alumno_id || calificacion === undefined) {
      logger.warn("Alumno ID y calificación son requeridos", { id });
      return res
        .status(400)
        .json({ message: "Alumno ID y calificación son requeridos." });
    }

    // Validar que la calificación esté en el rango permitido
    if (calificacion < 0 || calificacion > 100) {
      logger.warn("La calificación debe estar entre 0 y 100", { id });
      return res
        .status(400)
        .json({ message: "La calificación debe estar entre 0 y 100." });
    }

    // Buscar la tarea por su ID
    const tarea = await Tarea.findById(id);

    if (!tarea) {
      logger.warn("Tarea no encontrada", { id });
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Buscar la entrega del alumno
    const entrega = tarea.entregas.find(
      (ent) => ent.alumno_id.toString() === alumno_id
    );

    if (!entrega) {
      logger.warn("Entrega no encontrada para el alumno", { alumno_id, tarea_id: id });
      return res
        .status(404)
        .json({ message: "Entrega no encontrada para el alumno." });
    }

    entrega.calificacion = calificacion;
    entrega.estatus = "Revisado";
    entrega.fecha_revision = new Date();

    // Guardar cambios
    await tarea.save();
    logger.info("Entrega calificada exitosamente", { alumno_id, tarea_id: id });
    res.status(200).json({
      message: "Entrega calificada exitosamente",
      entrega: {
        alumno_id,
        calificacion,
        estatus: entrega.estatus,
        fecha_revision: entrega.fecha_revision,
      },
    });
  } catch (error) {
    logger.error("Error al calificar entrega", { error: error.message });
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.obtenerEntregasPorTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { grupo_id } = req.query;

    if (!grupo_id) {
      logger.warn("El ID del grupo es requerido", { id });
      return res.status(400).json({ message: "El ID del grupo es requerido." });
    }

    const tarea = await Tarea.findOne({ _id: id, grupo_id }).populate(
      "entregas.alumno_id",
      "nombre correo"
    );

    if (!tarea) {
      logger.warn("Tarea no encontrada o no pertenece al grupo especificado", { id, grupo_id });
      return res.status(404).json({
        message: "Tarea no encontrada o no pertenece al grupo especificado.",
      });
    }
    logger.info("Entregas obtenidas exitosamente", { id, grupo_id });
    res.status(200).json({
      message: "Entregas obtenidas exitosamente.",
      entregas: tarea.entregas,
    });
  } catch (error) {
    logger.error("Error al obtener entregas", { error: error.message });
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.subirEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { alumno_id, archivo_entregado, tipo_archivo } = req.body;

    if (!alumno_id || !archivo_entregado || !tipo_archivo) {
      logger.warn("Los campos alumno_id, archivo_entregado y tipo_archivo son requeridos", { id });
      return res.status(400).json({
        message:
          "Los campos alumno_id, archivo_entregado y tipo_archivo son requeridos.",
      });
    }

    const tarea = await Tarea.findById(id);
    if (!tarea) {
      logger.warn("Tarea no encontrada", { id });
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    const alumno = await Usuario.findOne({ _id: alumno_id, rol: "alumno" });
    if (!alumno) {
      logger.warn("Alumno no encontrado o no tiene el rol adecuado", { alumno_id });
      return res
        .status(404)
        .json({ message: "Alumno no encontrado o no tiene el rol adecuado." });
    }

    const nuevaEntrega = {
      _id: new mongoose.Types.ObjectId(),
      alumno_id: new mongoose.Types.ObjectId(alumno_id),
      archivo_entregado,
      tipo_archivo,
      fecha_entrega: new Date(),
      estatus: "Entregado",
    };

    tarea.entregas.push(nuevaEntrega);
    await tarea.save();
    logger.info("Entrega subida exitosamente", { id, alumno_id });
    res.status(200).json({
      message: "Entrega subida exitosamente",
      entrega: nuevaEntrega,
    });
  } catch (error) {
    logger.error("Error al subir entrega", { error: error.message });
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


exports.eliminarEntrega = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const { id: usuarioId, rol } = req.user;

    if (rol !== 'alumno') {
      logger.warn("Acceso denegado", { usuarioId, rol });
      return res.status(403).json({ message: "Acceso denegado." });
    }

    // Buscar la tarea
    const tarea = await Tarea.findById(tareaId);
    if (!tarea) {
      logger.warn("Tarea no encontrada", { tareaId });
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Buscar la entrega del alumno en la lista de entregas
    const entregaIndex = tarea.entregas.findIndex(
      (entrega) =>
        entrega.alumno_id && entrega.alumno_id.toString() === usuarioId
    );

    if (entregaIndex === -1) {
      logger.warn("No se encontró una entrega del alumno para esta tarea", { tareaId, usuarioId });
      return res.status(400).json({ message: "No se encontró una entrega del alumno para esta tarea." });
    } else {
      const entrega = tarea.entregas[entregaIndex];

      if (entrega.estatus === "Revisado") {
        logger.warn("No se puede eliminar una entrega revisada", { tareaId, usuarioId });
        return res.status(400).json({
          message: "La entrega ya ha sido revisada y no puede ser modificada.",
        });
      }
    }

    // Eliminar la entrega
    tarea.entregas.splice(entregaIndex, 1);
    await tarea.save();
    logger.info("Entrega eliminada exitosamente", { tareaId, usuarioId });
    res.status(200).json({ message: "Entrega eliminada exitosamente." });
  } catch (error) {
    logger.error("Error al eliminar entrega", { error: error.message });
    res.status(500).json({ message: "Error interno del servidor." });
  }
};


exports.actualizarEntrega = async (req, res) => {
  try {
    const { tareaId, entregaId } = req.params;
    const { archivo_entregado, tipo_archivo, estatus } = req.body;

    const tarea = await Tarea.findById(tareaId);
    if (!tarea) {
      logger.warn("Tarea no encontrada", { tareaId });
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    const entrega = tarea.entregas.id(entregaId);
    if (!entrega) {
      logger.warn("Entrega no encontrada", { entregaId });
      return res.status(404).json({ message: "Entrega no encontrada." });
    }

    if (archivo_entregado) entrega.archivo_entregado = archivo_entregado;
    if (tipo_archivo) entrega.tipo_archivo = tipo_archivo;
    if (estatus) entrega.estatus = estatus;

    await tarea.save();

    logger.info("Entrega actualizada exitosamente", { tareaId, entregaId });
    res
      .status(200)
      .json({ message: "Entrega actualizada exitosamente.", entrega });
  } catch (error) {
    logger.error("Error al actualizar entrega", { error: error.message });
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
exports.obtenerTareasCalendario = async (req, res) => {
  try {
    const { mes, year, timezone = "UTC" } = req.query;
    const userId = req.user.id;
    const userRole = req.user.rol;

    if (!mes || !year) {
      logger.warn("Parámetros 'mes' y 'year' son obligatorios", { mes, year });
      return res.status(400).json({ error: "Parámetros 'mes' y 'anio' son obligatorios" });
    }

    const mesInt = parseInt(mes); // enero = 1
    const yearInt = parseInt(year);

    // Obtener fecha de inicio y fin del mes en zona horaria enviada
    const getDateInUTC = (dateStr, tz) => {
      const date = new Date(dateStr);
      const utcDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
      return new Date(
        Date.UTC(
          utcDate.getFullYear(),
          utcDate.getMonth(),
          utcDate.getDate(),
          utcDate.getHours(),
          utcDate.getMinutes(),
          utcDate.getSeconds()
        )
      );
    };

    const localStart = new Date(`${yearInt}-${mesInt.toString().padStart(2, "0")}-01T00:00:00`);
    const localEnd = new Date(yearInt, mesInt, 0, 23, 59, 59); // Último día del mes

    const fechaInicio = getDateInUTC(localStart, timezone);
    const fechaFin = getDateInUTC(localEnd, timezone);

    let grupos = [];

    if (userRole === "maestro") {
      grupos = await Grupo.find({ maestro_id: userId }).select("_id");
    } else if (userRole === "alumno") {
      grupos = await Grupo.find({ "alumnos.alumno_id": userId }).select("_id");
    }

    const grupoIds = grupos.map((g) => g._id);

    const tareas = await Tarea.find({
      grupo_id: { $in: grupoIds },
      fecha_vencimiento: {
        $gte: fechaInicio,
        $lte: fechaFin,
      },
    })
      .select("titulo fecha_vencimiento grupo_id")
      .lean();

    const tareasParaCalendario = tareas.map((tarea) => {
      const localDate = new Date(tarea.fecha_vencimiento).toLocaleString("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      return {
        id: tarea._id.toString(),
        title: tarea.titulo,
        date: localDate.split(",")[0], // yyyy-mm-dd
        groupId: tarea.grupo_id.toString(),
        taskId: tarea._id.toString(),
      };
    });
    logger.info("Tareas del calendario obtenidas exitosamente", { mes, year });
    res.status(200).json(tareasParaCalendario);
  } catch (error) {
    logger.error("Error al obtener tareas del calendario", { error: error.message });
    res.status(500).json({ error: "Error al obtener las tareas del calendario" });
  }
};
