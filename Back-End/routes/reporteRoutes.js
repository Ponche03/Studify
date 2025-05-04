const express = require("express");
const router = express.Router();
const { obtenerReporteDesempeno, obtenerReporteTareas, obtenerReporteAsistencia} = require("../controllers/reportesController");
const authMiddleware = require("../middlewares/authMiddleware");

// Ruta para reportes de desempeño general
router.get("/reports/asistencia", authMiddleware, obtenerReporteAsistencia);

// Ruta para reportes de tareas y evaluaciones
router.get("/reports/tareas", authMiddleware, obtenerReporteTareas);

// Ruta para reportes de tareas y evaluaciones
router.get("/reports/desempeño", authMiddleware, obtenerReporteDesempeno);

module.exports = router;