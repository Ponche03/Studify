const grupoController = require("../controllers/grupoController");
const authMiddleware = require("../middlewares/authMiddleware");

const express = require("express");
const router = express.Router();

// Ruta para registrar un grupo
router.post("/groups", grupoController.crearGrupo);

// Ruta para agregar un alumno a un grupo
router.post("/groups/:group_id/addStudent", grupoController.añadirAlumnoAGrupo);


module.exports = router;
