const express = require("express");
const router = express.Router();
const { crearPost, actualizarPost, obtenerPostsPorGrupo } = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");

// Ruta para crear un post
router.post("/posts", authMiddleware, crearPost);

// Ruta para actualizar un post
router.patch("/posts/:id", authMiddleware, actualizarPost);

// Ruta para obtener posts de un grupo
router.get("/posts", authMiddleware, obtenerPostsPorGrupo);

module.exports = router;