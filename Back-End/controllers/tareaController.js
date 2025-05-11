const mongoose = require("mongoose");
const Tarea = require("../models/tareaModel");
const Grupo = require("../models/grupoModel");
const Usuario = require("../models/usuarioModel");
const fs = require("fs");
const path = require("path");

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

    if (!mongoose.Types.ObjectId.isValid(grupo_id)) {
      return res.status(400).json({ error: "ID de grupo no válido" });
    }

    // Verificar si el grupo existe
    const grupo = await Grupo.findById(grupo_id);
    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    // Validar que los campos requeridos están presentes
    if (!titulo || !descripcion || !fecha_vencimiento || !puntos_totales) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Validar que el estatus sea uno de los valores permitidos
    const estatusValido = ["Abierta", "Cerrada"];
    if (estatus && !estatusValido.includes(estatus)) {
      return res.status(400).json({ error: "Estatus no válido" });
    }

    // Convertir fecha_vencimiento a Date si es necesario
    const fechaVencimiento = new Date(fecha_vencimiento);
    if (isNaN(fechaVencimiento.getTime())) {
      return res.status(400).json({ error: "Fecha de vencimiento no válida" });
    }

    // Crear la tarea
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

    // Guardar la tarea en la base de datos
    await nuevaTarea.save();

    // Responder con la tarea creada
    res.status(201).json({
      message: "Tarea creada exitosamente",
      task: {
        _id: nuevaTarea._id,
        titulo: nuevaTarea.titulo,
        descripcion: nuevaTarea.descripcion,
        fecha_vencimiento: nuevaTarea.fecha_vencimiento,
        archivo: nuevaTarea.archivo,
        tipo_archivo: nuevaTarea.tipo_archivo,
        grupo_id: nuevaTarea.grupo_id,
        puntos_totales: nuevaTarea.puntos_totales,
        estatus: nuevaTarea.estatus,
      },
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.actualizarTarea = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el id de la tarea desde los parámetros de la URL
    const {
      titulo,
      descripcion,
      fecha_vencimiento,
      archivo,
      tipo_archivo,
      puntos_totales,
      estatus,
    } = req.body;

    // Buscar la tarea en la base de datos por su ID
    const tarea = await Tarea.findById(id);
    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    // Validar que el estatus sea uno de los valores permitidos
    const estatusValido = ["Abierta", "Cerrada"];
    if (estatus && !estatusValido.includes(estatus)) {
      return res.status(400).json({ error: "Estatus no válido" });
    }

    // Actualizar los campos de la tarea (solo los proporcionados en el cuerpo de la solicitud)
    tarea.titulo = titulo || tarea.titulo;
    tarea.descripcion = descripcion || tarea.descripcion;
    tarea.fecha_vencimiento = fecha_vencimiento || tarea.fecha_vencimiento;
    tarea.puntos_totales = puntos_totales || tarea.puntos_totales;
    tarea.estatus = estatus || tarea.estatus;
    tarea.archivo = archivo || tarea.archivo;
    tarea.tipo_archivo = tipo_archivo || tarea.tipo_archivo;

    // Guardar los cambios en la base de datos
    await tarea.save();

    // Responder con el mensaje de éxito y la tarea actualizada
    res.status(200).json({
      message: "Tarea actualizada exitosamente",
      task: {
        _id: tarea._id,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        fecha_vencimiento: tarea.fecha_vencimiento,
        archivo: tarea.archivo,
        tipo_archivo: tarea.tipo_archivo,
        grupo_id: tarea.grupo_id,
        puntos_totales: tarea.puntos_totales,
        estatus: tarea.estatus,
      },
    });
  } catch (error) {
    console.error("Error:", error);
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
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    // Responder con un mensaje de éxito
    res.status(200).json({
      message: "Tarea eliminada exitosamente.",
    });
  } catch (error) {
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
      filters.titulo = { $regex: `^${titulo}$`, $options: "i" };
    }

    const pageSize = 10;
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

    res.status(200).json({
      total: totalTasks,
      page: page,
      totalPages: totalPages,
      tasks: tasks,
    });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
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

    res.status(200).json(tarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.calificarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { alumno_id, calificacion } = req.body;

    if (!alumno_id || calificacion === undefined) {
      return res
        .status(400)
        .json({ message: "Alumno ID y calificación son requeridos." });
    }

    // Validar que la calificación esté en el rango permitido
    if (calificacion < 0 || calificacion > 100) {
      return res
        .status(400)
        .json({ message: "La calificación debe estar entre 0 y 100." });
    }

    // Buscar la tarea por su ID
    const tarea = await Tarea.findById(id);

    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Buscar la entrega del alumno
    const entrega = tarea.entregas.find(
      (ent) => ent.alumno_id.toString() === alumno_id
    );

    if (!entrega) {
      return res
        .status(404)
        .json({ message: "Entrega no encontrada para el alumno." });
    }

    entrega.calificacion = calificacion;
    entrega.estatus = "Revisado";
    entrega.fecha_revision = new Date();

    // Guardar cambios
    await tarea.save();

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
    console.error("Error al calificar entrega:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.obtenerEntregasPorTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { grupo_id } = req.query;

    if (!grupo_id) {
      return res.status(400).json({ message: "El ID del grupo es requerido." });
    }

    const tarea = await Tarea.findOne({ _id: id, grupo_id }).populate(
      "entregas.alumno_id",
      "nombre correo"
    );

    if (!tarea) {
      return res.status(404).json({
        message: "Tarea no encontrada o no pertenece al grupo especificado.",
      });
    }

    res.status(200).json({
      message: "Entregas obtenidas exitosamente.",
      entregas: tarea.entregas,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.subirEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { alumno_id, archivo_entregado, tipo_archivo } = req.body;

    if (!alumno_id || !archivo_entregado || !tipo_archivo) {
      return res.status(400).json({
        message:
          "Los campos alumno_id, archivo_entregado y tipo_archivo son requeridos.",
      });
    }

    const tarea = await Tarea.findById(id);
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    const alumno = await Usuario.findOne({ _id: alumno_id, rol: "alumno" });
    if (!alumno) {
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

    res.status(200).json({
      message: "Entrega subida exitosamente",
      entrega: nuevaEntrega,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.eliminarEntrega = async (req, res) => {
  try {
    const { tareaId, entregaId } = req.params;

    const tarea = await Tarea.findById(tareaId);
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    const entregaIndex = tarea.entregas.findIndex(
      (entrega) => entrega._id.toString() === entregaId
    );

    if (entregaIndex === -1) {
      return res.status(404).json({ message: "Entrega no encontrada." });
    }

    tarea.entregas.splice(entregaIndex, 1);
    await tarea.save();

    res.status(200).json({ message: "Entrega eliminada exitosamente." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.actualizarEntrega = async (req, res) => {
  try {
    const { tareaId, entregaId } = req.params;
    const { archivo_entregado, tipo_archivo, estatus } = req.body;

    const tarea = await Tarea.findById(tareaId);
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    const entrega = tarea.entregas.id(entregaId);
    if (!entrega) {
      return res.status(404).json({ message: "Entrega no encontrada." });
    }

    if (archivo_entregado) entrega.archivo_entregado = archivo_entregado;
    if (tipo_archivo) entrega.tipo_archivo = tipo_archivo;
    if (estatus) entrega.estatus = estatus;

    await tarea.save();

    res
      .status(200)
      .json({ message: "Entrega actualizada exitosamente.", entrega });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
