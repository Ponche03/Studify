const usuarioController = require("../controllers/usuarioController");

const express = require("express");
const router = express.Router();

// Ruta para iniciar sesión
router.post("/logIn", usuarioController.logIn);

// Ruta para registrar un usuario
router.post("/users", usuarioController.registrarUsuario);

module.exports = router;
