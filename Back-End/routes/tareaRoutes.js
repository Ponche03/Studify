const taskController = require("../controllers/tareaController");

const express = require("express");
const router = express.Router();

// Ruta para crear una tarea
router.post("/tasks", taskController.crearTarea);

// Ruta para actualizar una tarea
router.patch("/tasks/:id", taskController.actualizarTarea);

// Ruta para eliminar una tarea
router.delete("/tasks/:id", taskController.eliminarTarea);

// Ruta para obtener tareas asociadas a un usuario con filtros
router.get("/tasks", taskController.obtenerTareas);

// Ruta para obtener información detallada de una tarea
router.get("/tasks/:id", taskController.obtenerTarea);

// Ruta para obtener el archivo asociado a una tarea en base64
router.get("/tasks/:id/getTaskFile", taskController.obtenerArchivoTarea);

// Ruta para subir archivo a una tarea (entrega)
router.post("/tasks/:id/uploadFile", taskController.subirEntrega);

// Ruta para subir archivo a una tarea (entrega)
router.delete("/tasks/:id/deleteFile", taskController.eliminarEntrega);

// Ruta para calificar una tarea
router.post("/tasks/:id/gradeTask", taskController.calificarTarea);

// Ruta para actualizar una entrega específica de una tarea
router.put("/tasks/:tareaId/uploads/:entregaId", taskController.actualizarEntrega);

module.exports = router;