const usuarioController = require("../controllers/usuarioController");

const express = require("express");
const router = express.Router();

// Ruta para iniciar sesión
router.post("/logIn", usuarioController.logIn);

// Ruta para registrar un usuario
router.post("/users", usuarioController.registrarUsuario);

// Ruta para obtener detalles de un usuario
router.get("/users/:id", usuarioController.obtenerUsuario);

// Ruta para obtener la imagen de perfil en base64
router.get("/users/:id/getProfilePicture", usuarioController.obtenerImagenPerfil);

// Ruta para obtener la imagen de perfil en base64
router.post("/users/:id/uploadProfilePicture", usuarioController.subirImagenPerfil);

// Ruta para editar un usuario
router.put("/users/:id", usuarioController.editarUsuario);

// Ruta para eliminar un usuario
router.delete("/users/:id", usuarioController.borrarUsuario);

module.exports = router;