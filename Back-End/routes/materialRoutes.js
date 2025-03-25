const express = require("express");
const router = express.Router();
const { agregarMaterial, eliminarMaterial, obtenerMateriales } = require("../controllers/materialController");

// Ruta para agregar material
router.post("/classmat", agregarMaterial);

// Ruta para eliminar material
router.delete("/classmat/:id", eliminarMaterial);

// Ruta para obtener materiales
router.get("/classmat", obtenerMateriales);

module.exports = router;