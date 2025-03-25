const grupoController = require("../controllers/grupoController");
const authMiddleware = require("../middlewares/authMiddleware");

const express = require("express");
const router = express.Router();

// Ruta para registrar un grupo
router.post("/groups", grupoController.crearGrupo);

// Ruta para agregar un alumno a un grupo
router.post("/groups/:group_id/addStudent", grupoController.añadirAlumnoAGrupo);

// Ruta para archivar un grupo
router.post("/groups/:id/archive", grupoController.archivarGrupo);

// Ruta para desarchivar un grupo
router.post("/groups/:group_id/dearchive", grupoController.desarchivarGrupo);

// Ruta para obtener los grupos con un parámetro de página como query
router.get("/groups", grupoController.obtenerGrupos);

// Ruta para editar un grupo
router.patch("/groups/:group_id", grupoController.editarGrupo);

// Ruta para obtener la información de un grupo con sus posts
router.get("/groups/:id", grupoController.obtenerGrupoConPosts);

// Ruta para obtener los alumnos de un grupo específico
router.get("/groups/:id/getStudents", grupoController.obtenerAlumnosDeGrupo);


module.exports = router;
