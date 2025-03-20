const Tarea = require("../models/tareaModel");
const Grupo = require("../models/grupoModel");

exports.crearTarea = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      fecha_vencimiento,
      archivo,
      grupo_id,
      puntos_totales,
    } = req.body;

    // Verificar si el grupo existe
    const grupo = await Grupo.findById(grupo_id);
    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    // Crear la tarea
    const nuevaTarea = new Tarea({
      titulo,
      descripcion,
      fecha_vencimiento,
      archivo,
      grupo_id,
      puntos_totales,
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
        grupo_id: nuevaTarea.grupo_id,
        puntos_totales: nuevaTarea.puntos_totales,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.actualizarTarea = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el id de la tarea desde los parámetros de la URL
    const { titulo, descripcion, fecha_vencimiento, archivo, puntos_totales } =
      req.body;

    // Buscar la tarea en la base de datos por su ID
    const tarea = await Tarea.findById(id);
    if (!tarea) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    // Actualizar los campos de la tarea (solo los proporcionados en el cuerpo de la solicitud)
    tarea.titulo = titulo || tarea.titulo;
    tarea.descripcion = descripcion || tarea.descripcion;
    tarea.fecha_vencimiento = fecha_vencimiento || tarea.fecha_vencimiento;
    tarea.archivo = archivo || tarea.archivo;
    tarea.puntos_totales = puntos_totales || tarea.puntos_totales;

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
        grupo_id: tarea.grupo_id,
        puntos_totales: tarea.puntos_totales,
      },
    });
  } catch (error) {
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
    // Obtener parámetros de la consulta
    const { pagina = 1, status, fecha_inicio, fecha_fin } = req.query;

    // Convertir la página a número
    const page = parseInt(pagina);

    // Definir los filtros
    const filters = {};
    if (status) {
      filters.estado = status;
    }
    if (fecha_inicio && fecha_fin) {
      filters.fecha_vencimiento = {
        $gte: new Date(fecha_inicio), // Fecha de inicio mayor o igual
        $lte: new Date(fecha_fin), // Fecha de fin menor o igual
      };
    }

    // Calcular el número de documentos a saltar según la página
    const pageSize = 10; // Número de elementos por página
    const skip = (page - 1) * pageSize;

    // Obtener las tareas con filtros, paginación y limitación
    const tasks = await Tarea.find(filters).skip(skip).limit(pageSize);

    // Contar el total de tareas que cumplen los filtros
    const totalTasks = await Tarea.countDocuments(filters);

    // Responder con las tareas, total y página actual
    res.status(200).json({
      total: totalTasks,
      page: page,
      tasks: tasks,
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.obtenerTarea = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID de la tarea desde los parámetros de la URL

    // Buscar la tarea por su ID
    const tarea = await Tarea.findById(id)
      .populate("grupo_id", "nombre") // Opcional: Poblamos el grupo con su nombre
      .populate("entregas.alumno_id", "nombre email") // Poblamos los datos de los alumnos que entregaron tareas
      .populate("calificaciones.alumno_id", "nombre email"); // Poblamos los datos de los alumnos calificados

    // Si no se encuentra la tarea, retornar un error
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Devolver la tarea con las entregas y calificaciones asociadas
    res.status(200).json(tarea);
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.calificarTarea = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID de la tarea desde los parámetros de la URL
    const { alumno_id, calificacion } = req.body; // Obtener el alumno y la calificación desde el cuerpo de la solicitud

    // Validación básica de los datos
    if (!alumno_id || calificacion === undefined) {
      return res
        .status(400)
        .json({ message: "Alumno ID y calificación son requeridos." });
    }

    // Validar que la calificación esté en el rango permitido (por ejemplo, 0 a 10)
    if (calificacion < 0 || calificacion > 10) {
      return res
        .status(400)
        .json({ message: "La calificación debe estar entre 0 y 10." });
    }

    // Buscar la tarea por su ID
    const tarea = await Tarea.findById(id);

    // Si la tarea no se encuentra, retornar un error
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Buscar si ya existe una calificación para ese alumno
    const calificacionExistente = tarea.calificaciones.find(
      (cal) => cal.alumno_id.toString() === alumno_id
    );

    // Si ya existe una calificación, actualizarla
    if (calificacionExistente) {
      calificacionExistente.calificacion = calificacion;
    } else {
      // Si no existe, agregar una nueva calificación
      tarea.calificaciones.push({
        alumno_id: mongoose.Types.ObjectId(alumno_id),
        calificacion,
      });
    }

    // Guardar la tarea con la nueva calificación
    await tarea.save();

    // Devolver la respuesta exitosa con los datos de la calificación
    res.status(200).json({
      message: "Calificación registrada exitosamente",
      calificacion: {
        alumno_id,
        calificacion,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.subirEntrega = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID de la tarea desde los parámetros de la URL
    const { alumno_id, archivo_entregado } = req.body; // Obtener el alumno y el archivo entregado desde el cuerpo de la solicitud

    // Validación básica de los datos
    if (!alumno_id || !archivo_entregado) {
      return res
        .status(400)
        .json({ message: "Alumno ID y archivo son requeridos." });
    }

    // Buscar la tarea por su ID
    const tarea = await Tarea.findById(id);

    // Si la tarea no se encuentra, retornar un error
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Crear la nueva entrega
    const nuevaEntrega = {
      alumno_id: mongoose.Types.ObjectId(alumno_id),
      archivo_entregado,
      fecha_entrega: new Date(),
    };

    // Agregar la entrega al array de entregas de la tarea
    tarea.entregas.push(nuevaEntrega);

    // Guardar la tarea actualizada
    await tarea.save();

    // Devolver la respuesta exitosa con los datos de la entrega
    res.status(200).json({
      message: "Entrega subida exitosamente",
      entrega: nuevaEntrega,
    });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
