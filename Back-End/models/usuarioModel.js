const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  rol: { type: String, enum: ["maestro", "alumno"], required: true },
  password: { type: String, required: true },
  grupo_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Grupo" }],
  foto_perfil: { type: String, required: false }
});

module.exports = mongoose.model("Usuario", usuarioSchema);
