const mongoose = require("mongoose");

const grupoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  maestro_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  alumnos: [
    {
      alumno_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
      numero_lista: Number
    }
  ],
  posts: [{ type: mongoose.Schema.Types.ObjectId }]
});

module.exports = mongoose.model("Grupo", grupoSchema);
