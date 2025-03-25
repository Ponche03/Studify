const MaterialClase = require("../models/materialClaseModel");

// POST /classmat/ - Agregar material de clase
const agregarMaterial = async (req, res) => {
  try {
    const { grupo_id, maestro_id, titulo, descripcion, archivo, fecha_subida } = req.body;

    // Crear nuevo material de clase
    const nuevoMaterial = new MaterialClase({
      grupo_id,
      maestro_id,
      titulo,
      descripcion,
      archivo,
      fecha_subida,
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
    const { id } = req.params;

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

// GET /classmat?group_id=1 - Obtener materiales de un grupo
const obtenerMateriales = async (req, res) => {
  try {
    const { group_id } = req.query;

    // Buscar materiales por grupo_id
    const materiales = await MaterialClase.find({ grupo_id: group_id });

    res.status(200).json({
      message: "Materiales obtenidos exitosamente",
      materiales,
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