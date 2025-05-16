const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require('cors');

require('./cron/actualizarTareas'); 

// Load environment variables
dotenv.config();

// Middleware for parsing all upcoming requests into JSON
const app = express();


app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB");

    // Verificar tareas vencidas al iniciar el servidor
    const actualizarTareasVencidas = require('./utils/actualizarTareas');
    await actualizarTareasVencidas();
  })
  .catch(err => console.log(err));


// Routes
app.use("/api", require("./routes/usuarioRoutes"));
app.use("/api", require("./routes/grupoRoutes"));
app.use("/api", require("./routes/tareaRoutes"));
app.use("/api", require("./routes/postRoutes"));
app.use("/api", require("./routes/asistenciaRoutes"));
app.use("/api", require("./routes/materialRoutes"));
app.use("/api", require("./routes/reporteRoutes"));
app.use("/api", require("./routes/chatbotRoutes"));
// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
