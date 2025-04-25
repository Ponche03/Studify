const express = require("express");
const router = express.Router();
const { agregarMaterial, eliminarMaterial, obtenerMateriales } = require("../controllers/materialController");
const authMiddleware = require("../middlewares/authMiddleware");

// Ruta para agregar material
router.post("/classmat", authMiddleware, agregarMaterial);

// Ruta para eliminar material
router.delete("/classmat/:id", authMiddleware, eliminarMaterial);

// Ruta para obtener materiales
router.get("/classmat", authMiddleware, obtenerMateriales);

module.exports = router;