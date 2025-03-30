const mongoose = require("mongoose");
const tareaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  fecha_vencimiento: { type: Date },
  archivo: { type: String },
  grupo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", required: true },
  estatus: { 
    type: String, 
    enum: ['Abierta', 'Cerrada'], 
    required: true 
  },
  puntos_totales: { type: Number, required: true },
  entregas: [
    {
      alumno_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
      archivo_entregado: String,
      fecha_entrega: Date
    }
  ],
  calificaciones: [
    {
      alumno_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
      calificacion: Number
    }
  ]
});


module.exports = mongoose.model("Tarea", tareaSchema);
