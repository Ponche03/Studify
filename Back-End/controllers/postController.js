const Post = require("../models/postModel");
const Grupo = require("../models/grupoModel");
const Usuario = require("../models/usuarioModel");

// Crear un nuevo post
const crearPost = async (req, res) => {
  try {
    const { grupo_id, autor_id, contenido, archivo_adjunto, tipo_contenido, maestro_id } = req.body;

    // Validar campos obligatorios
    if (!grupo_id || !autor_id || !contenido || !tipo_contenido || !maestro_id) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    // Verificar que el grupo y el autor existan
    const grupo = await Grupo.findById(grupo_id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    const autor = await Usuario.findById(autor_id);
    if (!autor) return res.status(404).json({ message: "Usuario no encontrado" });

    // Verificar que el maestro exista
    const maestro = await Usuario.findById(maestro_id);
    if (!maestro) return res.status(404).json({ message: "Maestro no encontrado" });

    // Crear el post
    const nuevoPost = new Post({
      grupo_id,
      autor_id,
      contenido,
      archivo_adjunto, // Cambiado para coincidir con la base de datos
      tipo_contenido,
      maestro_id,
      fecha_post: new Date(), // Agregar la fecha actual como fecha_post
    });

    const postGuardado = await nuevoPost.save();
    res.status(201).json({
      message: "Post creado exitosamente",
      post: postGuardado,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear el post", error: error.message });
  }
};

// Actualizar un post existente
const actualizarPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido, archivo } = req.body;

    // Validar que al menos un campo esté presente
    if (!contenido && !archivo) {
      return res.status(400).json({ message: "Debe proporcionar al menos un campo para actualizar." });
    }

    const postActualizado = await Post.findByIdAndUpdate(
      id,
      { contenido, archivo },
      { new: true, runValidators: true }
    );

    if (!postActualizado) return res.status(404).json({ message: "Post no encontrado" });

    res.status(200).json({
      message: "Post actualizado exitosamente",
      post: postActualizado,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el post", error: error.message });
  }
};

// Obtener lista de posts de un grupo específico, ordenados por fecha
const obtenerPostsPorGrupo = async (req, res) => {
  try {
    const { group_id } = req.query; // El parámetro de consulta sigue siendo group_id

    if (!group_id) {
      return res.status(400).json({ message: "El parámetro 'group_id' es obligatorio." });
    }

    // Ajustar la consulta para que coincida con la estructura de la base de datos
    const posts = await Post.find({ grupo_id: group_id })
      .sort({ fecha_post: -1 }) // Ordenar por fecha_post descendente
      .populate("maestro_id", "nombre email") // Población del maestro (si aplica)
      .populate("grupo_id", "nombre"); // Población del grupo

    if (posts.length === 0) {
      return res.status(404).json({ message: "No se encontraron posts para este grupo." });
    }

    res.status(200).json({
      posts,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los posts", error: error.message });
  }
};

module.exports = {
  crearPost,
  actualizarPost,
  obtenerPostsPorGrupo,
};