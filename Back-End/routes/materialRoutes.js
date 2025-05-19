const express = require("express");
const router = express.Router();
const { agregarMaterial, eliminarMaterial, obtenerMateriales } = require("../controllers/materialController");
const authMiddleware = require("../middlewares/authMiddleware");
const teacherGroupCheckMiddleware = require("../middlewares/teacherGroupCheckMiddleware");

router.use(authMiddleware);
// Ruta para agregar material
router.post("/classmat", teacherGroupCheckMiddleware, agregarMaterial);

// Ruta para eliminar material
router.delete("/classmat/:group_id/delete/:material_id", teacherGroupCheckMiddleware, eliminarMaterial);

// Ruta para obtener materiales
router.get("/classmat", teacherGroupCheckMiddleware, obtenerMateriales);

module.exports = router;