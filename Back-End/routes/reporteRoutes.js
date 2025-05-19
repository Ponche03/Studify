const express = require("express");
const router = express.Router();
const { obtenerReporteDesempeno, obtenerReporteTareas, obtenerReporteAsistencia} = require("../controllers/reportesController");
const authMiddleware = require("../middlewares/authMiddleware");
const teacherGroupCheckMiddleware = require("../middlewares/teacherGroupCheckMiddleware");
const validRoleMiddleware = require("../middlewares/validRoleMiddleware");

router.use(authMiddleware);

// Ruta para reportes de desempeño general
router.get("/reports/asistencia", validRoleMiddleware("maestro"), obtenerReporteAsistencia);

// Ruta para reportes de tareas y evaluaciones
router.get("/reports/tareas", validRoleMiddleware("maestro"), obtenerReporteTareas);

// Ruta para reportes de tareas y evaluaciones
router.get("/reports/desempeno", validRoleMiddleware("maestro"), obtenerReporteDesempeno);

module.exports = router;