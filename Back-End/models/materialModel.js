const mongoose = require("mongoose");

const MaterialClaseSchema = new mongoose.Schema({
  grupo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", required: true },
  maestro_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  archivo: { type: String, required: true },
  fecha_subida: { type: Date, default: Date.now },
  tipo: {type: String, required: true}
});

module.exports = mongoose.model("MaterialClase", MaterialClaseSchema);
