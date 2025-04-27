const usuarioController = require("../controllers/usuarioController");
const authMiddleware = require("../middlewares/authMiddleware");

const express = require("express");
const router = express.Router();

// Ruta para iniciar sesión
router.post("/logIn", usuarioController.logIn);

// Ruta para registrar un usuario
router.post("/users", usuarioController.registrarUsuario);

// Ruta para obtener detalles de un usuario
router.get("/users/:id", authMiddleware, usuarioController.obtenerUsuario);

// Ruta para editar un usuario
router.put("/users/:id", authMiddleware, usuarioController.editarUsuario);

// Ruta para eliminar un usuario
router.delete("/users/:id", authMiddleware, usuarioController.borrarUsuario);

// Ruta para obtener usuario por email (usando query)
router.get("/users", authMiddleware, usuarioController.obtenerUsuarioPorEmail);

module.exports = router;