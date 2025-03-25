const Post = require("../models/postModel");
const Grupo = require("../models/grupoModel");
const Usuario = require("../models/usuarioModel");

// Crear un nuevo post
const crearPost = async (req, res) => {
  try {
    const { grupo_id, autor_id, contenido, archivo } = req.body;

    // Verificar que el grupo y el autor existan
    const grupo = await Grupo.findById(grupo_id);
    if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

    const autor = await Usuario.findById(autor_id);
    if (!autor) return res.status(404).json({ message: "Usuario no encontrado" });

    // Crear el post
    const nuevoPost = new Post({
      grupo_id,
      autor_id,
      contenido,
      archivo,
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
    const { group_id } = req.query;

    const posts = await Post.find({ grupo_id: group_id })
      .sort({ fecha_creacion: -1 }) // Ordenar por fecha de creación descendente
      .populate("autor_id", "nombre email") // Población del autor
      .populate("grupo_id", "nombre"); // Población del grupo

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