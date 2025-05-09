const grupoController = require("../controllers/grupoController");
const authMiddleware = require("../middlewares/authMiddleware");

const express = require("express");
const router = express.Router();

// Ruta para registrar un grupo
router.post("/groups", authMiddleware, grupoController.crearGrupo);

// Ruta para agregar un alumno a un grupo
router.post("/groups/:group_id/addStudent", authMiddleware,grupoController.añadirAlumnoAGrupo);

// Ruta para archivar un grupo
router.post("/groups/:id/archive", authMiddleware, grupoController.archivarGrupo);

// Ruta para desarchivar un grupo
router.post("/groups/:group_id/dearchive", authMiddleware, grupoController.desarchivarGrupo);

// Ruta para obtener los grupos con un parámetro de página como query
router.get("/groups", authMiddleware, grupoController.obtenerGrupos);

// Ruta para editar un grupo
router.patch("/groups/:group_id", authMiddleware, grupoController.editarGrupo);

// Ruta para obtener la información de un grupo con sus posts
router.get("/groups/:id", authMiddleware, grupoController.obtenerGrupoConPosts);

// Ruta para obtener los alumnos de un grupo específico
router.get("/groups/:id/getStudents", authMiddleware, grupoController.obtenerAlumnosDeGrupo);

// Ruta para eliminar a un alumno de un grupo
router.delete("/groups/:group_id/removeStudent/:student_id", authMiddleware, grupoController.eliminarAlumnoDeGrupo);

module.exports = router;
