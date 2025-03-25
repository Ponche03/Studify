const express = require("express");
const router = express.Router();
const { obtenerReporteDesempeno, obtenerReporteTareas } = require("../controllers/reportesController");

// Ruta para reportes de desempeño general
router.get("/reports/performance", obtenerReporteDesempeno);

// Ruta para reportes de tareas y evaluaciones
router.get("/reports/tasks", obtenerReporteTareas);

module.exports = router;