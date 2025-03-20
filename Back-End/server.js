const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Middleware for parsing all upcoming requests into JSON
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));

// Routes
app.use("/api", require("./routes/usuarioRoutes"));
app.use("/api", require("./routes/grupoRoutes"));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


