const mongoose = require("mongoose");
const Grupo = require("../models/grupoModel");
const User = require("../models/usuarioModel");
const Post = require("../models/postModel");

exports.crearGrupo = async (req, res) => {
  try {
    const { nombre, descripcion, maestro_id, foto } = req.body;

    // Verificar si el maestro existe y su rol es "maestro"
    const maestro = await User.findById(maestro_id);
    if (!maestro || maestro.rol !== "maestro") {
      return res
        .status(400)
        .json({ error: "El maestro no existe o no tiene el rol adecuado." });
    }

    // Crear un nuevo grupo
    const nuevoGrupo = new Grupo({
      nombre,
      descripcion,
      maestro_id,
      foto,
      alumnos: [], // Inicialmente sin alumnos
    });

    // Guardar en la base de datos
    await nuevoGrupo.save();

    // Responder con el grupo creado
    res.status(200).json({
      message: "Grupo creado exitosamente",
      group: {
        _id: nuevoGrupo._id,
        nombre: nuevoGrupo.nombre,
        descripcion: nuevoGrupo.descripcion,
        maestro_id: nuevoGrupo.maestro_id,
        alumnos: nuevoGrupo.alumnos,
        foto: nuevoGrupo.foto,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

exports.añadirAlumnoAGrupo = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { alumno_id } = req.body;

    // Verificar si el grupo existe
    const group = await Grupo.findById(group_id);
    if (!group) {
      return res.status(404).json({ error: "El grupo no existe." });
    }

    // Verificar si el alumno existe
    const student = await User.findById(alumno_id);
    if (!student || student.rol !== "alumno") {
      return res
        .status(400)
        .json({ error: "El alumno no existe o no tiene el rol adecuado." });
    }

    // Verificar si el alumno ya está en el grupo
    const alumnoExistente = group.alumnos.some(
      (alumno) => alumno.alumno_id.toString() === alumno_id
    );
    if (alumnoExistente) {
      return res
        .status(400)
        .json({ error: "El alumno ya está en este grupo." });
    }

    // Determinar el número de lista automáticamente
    const numeroLista = group.alumnos.length + 1;

    // Agregar el alumno al grupo con el número de lista calculado
    group.alumnos.push({ alumno_id, numero_lista: numeroLista });
    await group.save();

    res.status(200).json({
      message: "Alumno agregado exitosamente",
      grupo_id: group._id,
      alumnos: group.alumnos,
    });
  } catch (error) {
    console.error(error); // Esto te mostrará el error completo en la consola
    res
      .status(500)
      .json({ error: "Error interno del servidor.", details: error.message });
  }
};

exports.archivarGrupo = async (req, res) => {
  try {
    const { id } = req.params;

    const grupo = await Grupo.findByIdAndUpdate(
      id,
      { archivado: true },
      { new: true }
    );

    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    res.status(200).json({
      message: "Grupo archivado",
      group: {
        _id: grupo._id,
        archivado: grupo.archivado,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.desarchivarGrupo = async (req, res) => {
  try {
    const { group_id } = req.params; // Obtener el ID del grupo desde los parámetros de la URL

    // Buscar el grupo por ID
    const grupo = await Grupo.findById(group_id);

    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    // Desarchivar el grupo (cambiar archivado a false)
    grupo.archivado = false;

    // Guardar los cambios en la base de datos
    await grupo.save();

    // Responder con el mensaje y el grupo desarchivado
    res.status(200).json({
      message: "Grupo desarchivado",
      group: {
        _id: grupo._id,
        archivado: grupo.archivado,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.obtenerGrupos = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado } = req.query;

    const usuarioId = req.user.id;

    let filtros = {
      $or: [{ maestro_id: usuarioId }, { "alumnos.alumno_id": usuarioId }],
    };

    if (estado === "archivado") {
      filtros.archivado = true;
    } else if (estado === "activo") {
      filtros.archivado = false;
    }
    // Buscar grupos paginados
    const grupos = await Grupo.find(filtros)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("maestro_id", "nombre")
      .select("_id nombre descripcion foto archivado maestro_id");

    // Contar total de grupos
    const total = await Grupo.countDocuments(filtros);
    const totalPages = Math.ceil(total / limit);

    // Formatear los datos
    const formattedGroups = grupos.map((grupo) => ({
      _id: grupo._id,
      nombre: grupo.nombre,
      descripcion: grupo.descripcion,
      foto: grupo.foto || null,
      estado: grupo.archivado ? "archivado" : "no archivado",
      maestro_id: grupo.maestro_id._id,
    }));

    res.status(200).json({
      total,
      page: Number(page),
      totalPages,
      groups: formattedGroups,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los grupos" });
  }
};

exports.editarGrupo = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { nombre, descripcion, foto } = req.body;

    // Buscar el grupo por ID
    const grupo = await Grupo.findById(group_id);

    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    // Actualizar los campos que fueron enviados en la solicitud
    if (nombre) grupo.nombre = nombre;
    if (descripcion) grupo.descripcion = descripcion;
    if (foto) grupo.foto = foto;

    // Guardar los cambios en la base de datos
    await grupo.save();

    // Responder con el grupo actualizado
    res.status(200).json({
      message: "Grupo actualizado",
      group: {
        _id: grupo._id,
        nombre: grupo.nombre,
        descripcion: grupo.descripcion,
        maestro_id: grupo.maestro_id,
        alumnos: grupo.alumnos.map((a) => a.alumno_id),
        foto: grupo.foto,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.obtenerGrupoConPosts = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del grupo desde los parámetros de la URL

    // Validar que el ID sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de grupo no válido" });
    }

    // Buscar el grupo por ID y poblar el maestro
    const grupo = await Grupo.findById(id).populate("maestro_id", "nombre");

    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    // Obtener los posts asociados al grupo, ordenados por fecha descendente
    const posts = await Post.find({ grupo_id: id }).sort({ createdAt: -1 });

    // Responder con la información del grupo y sus posts
    res.status(200).json({
      group: {
        _id: grupo._id,
        nombre: grupo.nombre,
        descripcion: grupo.descripcion,
        maestro: grupo.maestro_id ? grupo.maestro_id.nombre : null,
      },
      posts,
    });
  } catch (error) {
    console.error("Error al obtener grupo con posts:", error);
    res
      .status(500)
      .json({ error: error.message || "Error interno del servidor" });
  }
};

exports.obtenerAlumnosDeGrupo = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del grupo desde los parámetros de la URL

    // Buscar el grupo por su ID
    const grupo = await Grupo.findById(id);

    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    // Obtener los alumnos del grupo
    const alumnos = await User.find({
      _id: { $in: grupo.alumnos.map((alumno) => alumno.alumno_id) }, // Filtra los usuarios por los IDs de los alumnos asociados al grupo
    });

    // Mapear los datos de los alumnos, incluyendo el número de lista
    const alumnosConNumeroLista = alumnos.map((alumno) => {
      const numeroLista = grupo.alumnos.find(
        (a) => a.alumno_id.toString() === alumno._id.toString()
      ).numero_lista;
      return {
        _id: alumno._id,
        nombre: alumno.nombre,
        email: alumno.email,
        numero_lista: numeroLista,
      };
    });

    // Responder con la lista de alumnos
    res.status(200).json({
      alumnos: alumnosConNumeroLista,
    });
  } catch (error) {
    console.error("Error en obtenerAlumnosDeGrupo:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  }
};


exports.eliminarAlumnoDeGrupo = async (req, res) => {
  try {
    const { group_id, student_id } = req.params;

    // Verificar si el grupo existe
    const group = await Grupo.findById(group_id);
    if (!group) {
      return res.status(404).json({ error: "El grupo no existe." });
    }

    // Verificar si el alumno está en el grupo
    const index = group.alumnos.findIndex(
      (alumno) => alumno.alumno_id.toString() === student_id
    );

    if (index === -1) {
      return res
        .status(400)
        .json({ error: "El alumno no pertenece a este grupo." });
    }

    // Eliminar al alumno del grupo
    group.alumnos.splice(index, 1);

    // Recalcular los números de lista
    group.alumnos = group.alumnos.map((alumno, i) => ({
      ...alumno.toObject(),
      numero_lista: i + 1,
    }));

    await group.save();

    res.status(200).json({
      message: "Alumno eliminado exitosamente",
      grupo_id: group._id,
      alumnos: group.alumnos,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error interno del servidor.", details: error.message });
  }
};
