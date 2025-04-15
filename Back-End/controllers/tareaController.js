const Tarea = require("../models/tareaModel");
const Grupo = require("../models/grupoModel");

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const { bucket } = require("../firebase/firebaseSetup");
const { v4: uuidv4 } = require("uuid");

exports.crearTarea = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      fecha_vencimiento,
      archivo,
      grupo_id,
      puntos_totales,
      estatus,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(grupo_id)) {
      return res.status(400).json({ error: "ID de grupo no válido" });
    }

    const grupo = await Grupo.findById(grupo_id);
    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    if (!titulo || !descripcion || !fecha_vencimiento || !puntos_totales) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const estatusValido = ["Abierta", "Cerrada"];
    if (estatus && !estatusValido.includes(estatus)) {
      return res.status(400).json({ error: "Estatus no válido" });
    }

    const fechaVencimiento = new Date(fecha_vencimiento);
    if (isNaN(fechaVencimiento.getTime())) {
      return res.status(400).json({ error: "Fecha de vencimiento no válida" });
    }

    let archivoURL = null;

    if (archivo) {
      const matches = archivo.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "Formato de archivo no válido" });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      const extension = mimeType.split("/")[1];
      const nombreArchivo = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${extension}`;
      const file = admin.storage().bucket().file(nombreArchivo);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
      });

      archivoURL = `https://firebasestorage.googleapis.com/v0/b/${admin.storage().bucket().name}/o/${encodeURIComponent(nombreArchivo)}?alt=media&token=${file.metadata.metadata.firebaseStorageDownloadTokens}`;
    }

    const nuevaTarea = new Tarea({
      titulo,
      descripcion,
      fecha_vencimiento: fechaVencimiento,
      archivo: archivoURL,
      grupo_id,
      puntos_totales,
      estatus: estatus || "Abierta",
    });

    await nuevaTarea.save();

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

    if (archivo) {
      // Ruta donde se guardará el archivo dentro de la carpeta "uploads"
      const uploadsDir = path.join(__dirname, "../uploads");
    
      // Verificar si la carpeta 'uploads' existe, si no, crearla
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true }); // Crear la carpeta si no existe
      }
    
      // Decodificar Base64 a Buffer
      const base64Data = archivo.replace(
        /^data:application\/pdf;base64,/,
        ""
      ); // Limpiar el prefijo Base64
      const archivoBuffer = Buffer.from(base64Data, "base64");
    
      // Generar nombre único para el archivo
      const nombreArchivoFinal = `${id}_${Date.now()}.pdf`;
    
      // Ruta relativa para el archivo dentro de "uploads" usando el formato POSIX para separar directorios
      const rutaArchivo = path.posix.join("/uploads", nombreArchivoFinal); // Usar / como separador
    
      // Guardar archivo en el sistema de archivos (ubicado en la carpeta 'uploads')
      fs.writeFileSync(path.join(__dirname, "../", rutaArchivo), archivoBuffer);
    
      // Actualizar la ruta del archivo en el objeto tarea (solo guardará la ruta relativa)
      tarea.archivo = rutaArchivo;
    }
    

    // Actualizar los campos de la tarea (solo los proporcionados en el cuerpo de la solicitud)
    tarea.titulo = titulo || tarea.titulo;
    tarea.descripcion = descripcion || tarea.descripcion;
    tarea.fecha_vencimiento = fecha_vencimiento || tarea.fecha_vencimiento;
    tarea.puntos_totales = puntos_totales || tarea.puntos_totales;
    tarea.estatus = estatus || tarea.estatus;
    tarea.archivo = tarea.archivo;

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
    // Obtener parámetros de la consulta
    const { pagina = 1, status, fecha_inicio, fecha_fin, group_id } = req.query;

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
    if (group_id) {
      filters.grupo_id = group_id; // Filtro por group_id
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

exports.obtenerArchivoTarea = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID de la tarea desde los parámetros de la URL
    const tarea = await Tarea.findById(id); // Buscar la tarea por ID
    
    if (!tarea || !tarea.archivo) {
      return res.status(404).json({ error: "Archivo de tarea no encontrado." });
    }
    
    const rutaArchivo = path.join(__dirname, "..", tarea.archivo); // Obtener la ruta del archivo
    
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ error: "Archivo no encontrado." });
    }
    
    const archivoBuffer = fs.readFileSync(rutaArchivo); // Leer el archivo
    const archivoBase64 = archivoBuffer.toString("base64"); // Convertir el archivo a Base64
    
    res.status(200).json({ archivo: archivoBase64 }); // Enviar el archivo en Base64 como respuesta
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error interno del servidor." });
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

    // Validar que la calificación esté en el rango permitido
    if (calificacion < 0 || calificacion >= 100) {
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
        alumno_id: new mongoose.Types.ObjectId(alumno_id), // CORREGIDO
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
    console.error("Error:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.subirEntrega = async (req, res) => {
  try {
    const { id } = req.params; 
    const { alumno_id, archivo_entregado } = req.body;

    if (!alumno_id || !archivo_entregado) {
      return res
        .status(400)
        .json({ message: "Alumno ID y archivo son requeridos." });
    }

    // Verificar que la tarea exista
    const tarea = await Tarea.findById(id);
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Procesar archivo base64 (con o sin encabezado)
    let base64Data = archivo_entregado;
    let extension = "bin";
    if (archivo_entregado.startsWith("data:")) {
      const matches = archivo_entregado.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "Formato de archivo no válido." });
      }

      const mimeType = matches[1];
      base64Data = matches[2];

      const mimeMap = {
        "application/pdf": "pdf",
        "image/jpeg": "jpeg",
        "image/png": "png",
      };
      extension = mimeMap[mimeType] || "bin";
    }

    const buffer = Buffer.from(base64Data, "base64");

    // Generar nombre único + token de acceso
    const nombreArchivo = `${alumno_id}_${Date.now()}.${extension}`;
    const token = uuidv4();

    const archivo = bucket.file(nombreArchivo);
    await archivo.save(buffer, {
      metadata: {
        contentType: `application/${extension}`,
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
      public: false,
      resumable: false,
    });

    // Generar URL de descarga
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      nombreArchivo
    )}?alt=media&token=${token}`;

    // Crear y guardar la entrega
    const nuevaEntrega = {
      alumno_id: new mongoose.Types.ObjectId(alumno_id),
      archivo_entregado: url,
      fecha_entrega: new Date(),
    };

    tarea.entregas.push(nuevaEntrega);
    await tarea.save();

    res.status(200).json({
      message: "Entrega subida exitosamente",
      entrega: nuevaEntrega,
    });
  } catch (error) {
    console.error("Error al subir entrega:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.eliminarEntrega = async (req, res) => {
  try {
    const { tareaId } = req.params;
    const { alumno_id } = req.body;

    // Buscar la tarea por ID
    const tarea = await Tarea.findById(tareaId);
    if (!tarea) {
      return res.status(404).json({ message: "Tarea no encontrada." });
    }

    // Buscar la entrega del alumno en la tarea
    const entregaIndex = tarea.entregas.findIndex(
      (entrega) => entrega.alumno_id.toString() === alumno_id
    );
    if (entregaIndex === -1) {
      return res
        .status(404)
        .json({ message: "Entrega no encontrada para este alumno." });
    }

    // Obtener la ruta del archivo entregado
    const archivoRuta = path.join(
      __dirname,
      "..",
      tarea.entregas[entregaIndex].archivo_entregado
    );

    // Eliminar el archivo físico, si existe
    if (fs.existsSync(archivoRuta)) {
      fs.unlinkSync(archivoRuta); // Eliminar el archivo
    }

    // Eliminar la entrega del alumno en el array de entregas
    tarea.entregas.splice(entregaIndex, 1);

    // Guardar los cambios en la tarea
    await tarea.save();

    res.status(200).json({ message: "Entrega eliminada exitosamente." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
