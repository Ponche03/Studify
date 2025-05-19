const grupoController = require("../controllers/grupoController");
const authMiddleware = require("../middlewares/authMiddleware");
const teacherGroupCheckMiddleware = require("../middlewares/teacherGroupCheckMiddleware");
const validRoleMiddleware = require("../middlewares/validRoleMiddleware");

const express = require("express");
const router = express.Router();

router.use(authMiddleware);
// Ruta para registrar un grupo
router.post("/groups", validRoleMiddleware("maestro"), grupoController.crearGrupo);

// Ruta para agregar un alumno a un grupo
router.post("/groups/:group_id/addStudent", teacherGroupCheckMiddleware, grupoController.añadirAlumnoAGrupo);

// Ruta para archivar un grupo
router.post("/groups/:group_id/archive", teacherGroupCheckMiddleware, grupoController.archivarGrupo);

// Ruta para desarchivar un grupo
router.post("/groups/:group_id/dearchive", teacherGroupCheckMiddleware, grupoController.desarchivarGrupo);

// Ruta para obtener los grupos con un parámetro de página como query
router.get("/groups", grupoController.obtenerGrupos);

// Ruta para editar un grupo
router.patch("/groups/:group_id", teacherGroupCheckMiddleware, grupoController.editarGrupo);

// Ruta para obtener la información de un grupo con sus posts
router.get("/groups/:group_id",teacherGroupCheckMiddleware, grupoController.obtenerGrupoConPosts);

// Ruta para obtener los alumnos de un grupo específico
router.get("/groups/:group_id/getStudents", grupoController.obtenerAlumnosDeGrupo);

// Ruta para eliminar a un alumno de un grupo
router.delete("/groups/:group_id/removeStudent/:student_id", grupoController.eliminarAlumnoDeGrupo);

module.exports = router;
