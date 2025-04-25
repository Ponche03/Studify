const express = require("express");
const router = express.Router();
const { obtenerReporteDesempeno, obtenerReporteTareas } = require("../controllers/reportesController");
const authMiddleware = require("../middlewares/authMiddleware");

// Ruta para reportes de desempeño general
router.get("/reports/performance", authMiddleware, obtenerReporteDesempeno);

// Ruta para reportes de tareas y evaluaciones
router.get("/reports/tasks", authMiddleware, obtenerReporteTareas);

module.exports = router;