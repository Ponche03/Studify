const express = require("express");
const router = express.Router();
const { crearPost, actualizarPost, obtenerPostsPorGrupo } = require("../controllers/postController");

// Ruta para crear un post
router.post("/posts", crearPost);

// Ruta para actualizar un post
router.patch("/posts/:id", actualizarPost);

// Ruta para obtener posts de un grupo
router.get("/posts", obtenerPostsPorGrupo);

module.exports = router;