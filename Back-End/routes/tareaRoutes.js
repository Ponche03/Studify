const taskController = require("../controllers/tareaController");
const authMiddleware = require("../middlewares/authMiddleware");

const express = require("express");
const router = express.Router();

// Ruta para crear una tarea
router.post("/tasks", authMiddleware, taskController.crearTarea);

// Ruta para actualizar una tarea
router.patch("/tasks/:id", authMiddleware, taskController.actualizarTarea);

// Ruta para eliminar una tarea
router.delete("/tasks/:id", authMiddleware, taskController.eliminarTarea);

// Ruta para obtener tareas asociadas a un usuario con filtros
router.get("/tasks", authMiddleware, taskController.obtenerTareas);

// Ruta para obtener información detallada de una tarea
router.get("/tasks/:id", authMiddleware, taskController.obtenerTarea);

// Ruta para calificar una tarea
router.post("/tasks/:id/gradeTask", authMiddleware, taskController.calificarEntrega);

// Ruta para subir una entrega a una tarea
router.post("/tasks/:id/uploads", authMiddleware, taskController.subirEntrega);

// Ruta para obtener todas las entregas de una tarea por grupo
router.get("/tasks/:id/uploads", authMiddleware, taskController.obtenerEntregasPorTarea);

// Ruta para actualizar una entrega específica de una tarea
router.put("/tasks/:tareaId/uploads/:entregaId", authMiddleware, taskController.actualizarEntrega);

// Ruta para eliminar una entrega específica de una tarea
router.delete("/tasks/:tareaId/uploads/", authMiddleware, taskController.eliminarEntrega);

module.exports = router;
