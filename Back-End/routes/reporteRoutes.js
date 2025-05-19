const express = require("express");
const router = express.Router();
const { obtenerReporteDesempeno, obtenerReporteTareas, obtenerReporteAsistencia} = require("../controllers/reportesController");
const authMiddleware = require("../middlewares/authMiddleware");
const teacherGroupCheckMiddleware = require("../middlewares/teacherGroupCheckMiddleware");

router.use(authMiddleware);

// Ruta para reportes de desempeño general
router.get("/reports/asistencia", teacherGroupCheckMiddleware, obtenerReporteAsistencia);

// Ruta para reportes de tareas y evaluaciones
router.get("/reports/tareas", teacherGroupCheckMiddleware, obtenerReporteTareas);

// Ruta para reportes de tareas y evaluaciones
router.get("/reports/desempeno", teacherGroupCheckMiddleware, obtenerReporteDesempeno);

module.exports = router;