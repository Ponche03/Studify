const mongoose = require("mongoose");

const tareaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  fecha_vencimiento: { type: Date },
  archivo: { type: String },
  tipo_archivo: { type: String },
  grupo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", required: true },
  estatus: { 
    type: String, 
    enum: ['Abierta', 'Cerrada'], 
    required: true 
  },
  puntos_totales: { type: Number },
  entregas: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, 
      alumno_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
      nombre_usuario: { type: String }, 
      archivo_entregado: String,
      tipo_archivo: { type: String },
      fecha_entrega: Date,
      estatus: { 
        type: String, 
        enum: ['Pendiente', 'Entregado', 'Revisado'], 
        default: 'Pendiente' 
      },
      calificacion: { type: Number, min: 0, max: 100 }
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
