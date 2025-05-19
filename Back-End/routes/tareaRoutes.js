const taskController = require("../controllers/tareaController");
const authMiddleware = require("../middlewares/authMiddleware");
const teacherGroupCheckMiddleware = require("../middlewares/teacherGroupCheckMiddleware");
const validRoleMiddleware = require("../middlewares/validRoleMiddleware");
const express = require("express");
const router = express.Router();

router.use(authMiddleware);
// Ruta para crear una tarea
router.post("/tasks", teacherGroupCheckMiddleware, taskController.crearTarea);

// Ruta para actualizar una tarea
router.patch("/tasks/:id", teacherGroupCheckMiddleware, taskController.actualizarTarea);

// Ruta para eliminar una tarea
router.delete("/tasks/:group_id/delete/:id", teacherGroupCheckMiddleware, taskController.eliminarTarea);

// Ruta para obtener tareas asociadas a un usuario con filtros
router.get("/tasks", taskController.obtenerTareas);

router.get("/tasks/calendar", taskController.obtenerTareasCalendario);


// Ruta para obtener información detallada de una tarea
router.get("/tasks/:id", taskController.obtenerTarea);

// Ruta para calificar una tarea
router.post("/tasks/:id/gradeTask", teacherGroupCheckMiddleware, taskController.calificarEntrega);

// Ruta para subir una entrega a una tarea
router.post("/tasks/:id/uploads", taskController.subirEntrega);

// Ruta para obtener todas las entregas de una tarea por grupo
router.get("/tasks/:id/uploads", teacherGroupCheckMiddleware, taskController.obtenerEntregasPorTarea);

// Ruta para actualizar una entrega específica de una tarea
router.put("/tasks/:tareaId/uploads/:entregaId", taskController.actualizarEntrega);

// Ruta para eliminar una entrega específica de una tarea
router.delete("/tasks/:tareaId/uploads/", taskController.eliminarEntrega);

module.exports = router;
