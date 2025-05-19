const MaterialClase = require("../models/materialModel");

// POST /classmat/ - Agregar material de clase
const agregarMaterial = async (req, res) => {
  try {
    const { grupo_id, maestro_id, titulo, descripcion, archivo, fecha_subida, tipo } = req.body;

    // Crear nuevo material de clase
    const nuevoMaterial = new MaterialClase({
      grupo_id,
      maestro_id,
      titulo,
      descripcion,
      archivo,
      fecha_subida,
      tipo, // Nuevo campo
    });

    // Guardar en la base de datos
    const materialGuardado = await nuevoMaterial.save();

    res.status(200).json({
      message: "Material agregado exitosamente",
      material: materialGuardado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al agregar el material",
      error: error.message,
    });
  }
};

// DELETE /classmat/{id} - Eliminar material de clase
const eliminarMaterial = async (req, res) => {
  try {
    const { material_id } = req.params; // Obtener el ID del grupo y del material desde los parámetros de la URL
    const id = material_id;

    // Eliminar material por ID
    const materialEliminado = await MaterialClase.findByIdAndDelete(id);

    if (!materialEliminado) {
      return res.status(404).json({
        message: "Material no encontrado",
      });
    }

    res.status(200).json({
      message: "Material eliminado exitosamente",
      material_id: id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar el material",
      error: error.message,
    });
  }
};

// GET /classmat?group_id=1&search=palabra&page=1&limit=10
const obtenerMateriales = async (req, res) => {
  try {
    const { group_id, search = "", page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    // Construir la consulta
    const query = {
      grupo_id: group_id,
    };

    if (search) {
      query.titulo = { $regex: search, $options: "i" };
    }

    const materiales = await MaterialClase.find(query)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MaterialClase.countDocuments(query);

    res.status(200).json({
      message: "Materiales obtenidos exitosamente",
      materiales,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener los materiales",
      error: error.message,
    });
  }
};

module.exports = {
  agregarMaterial,
  eliminarMaterial,
  obtenerMateriales,
};