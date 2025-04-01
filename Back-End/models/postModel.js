const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  grupo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Grupo", required: true },
  maestro_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  contenido: { type: String, required: true },
  tipo_contenido: { type: String, enum: ["texto", "imagen", "video", "archivo"], required: true },
  archivo_adjunto: { type: String, default: null },
  fecha_post: { type: Date, default: Date.now }
},
{ versionKey: false }
);

module.exports = mongoose.model("Posts", PostSchema);
