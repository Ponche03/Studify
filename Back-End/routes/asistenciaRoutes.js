const express = require("express");
const router = express.Router();
const { guardarAsistencia, obtenerAsistencia } = require("../controllers/asistenciaController");

// Ruta para guardar asistencia
router.post("/attendance/", guardarAsistencia);

// Ruta para obtener asistencia
router.get("/attendance/", obtenerAsistencia);

module.exports = router;