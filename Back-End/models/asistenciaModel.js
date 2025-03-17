const mongoose = require("mongoose");

const AsistenciaSchema = new mongoose.Schema({
  grupo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", required: true },
  fecha: { type: Date, required: true },
  asistencias: [
    {
      alumno_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
      presente: { type: Boolean, required: true }
    }
  ]
});

module.exports = mongoose.model("Asistencia", AsistenciaSchema);
