const express = require("express");
const router = express.Router();
const { guardarAsistencia, obtenerAsistencia } = require("../controllers/asistenciaController");
const authMiddleware = require("../middlewares/authMiddleware");

// Ruta para guardar asistencia
router.post("/attendance/", authMiddleware, guardarAsistencia);

// Ruta para obtener asistencia
router.get("/attendance/", authMiddleware, obtenerAsistencia);

module.exports = router;