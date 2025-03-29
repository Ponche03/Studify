const User = require("../models/usuarioModel");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require('path');


exports.logIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar el usuario por correo electrónico
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "E-mail o contraseña inválidos" });

    // Comparar la contraseña ingresada con la contraseña almacenada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "E-mail o contraseña inválidos" });

    // Generar el token JWT
    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Responder con el mensaje, el token y la información del usuario
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      user: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        foto_perfil: user.foto_perfil,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

exports.registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, rol, password, foto_perfil } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: "Ya existe el nombre de usuario." });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    let fotoRuta = null;

    if (foto_perfil) {
      const matches = foto_perfil.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "Formato de imagen no válido." });
      }

      const extension = matches[1]; 
      const base64Data = matches[2]; 
      const buffer = Buffer.from(base64Data, "base64");

      const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      const rutaImagen = path.join(__dirname, "../uploads", nombreArchivo);

      fs.writeFileSync(rutaImagen, buffer);
      fotoRuta = `/uploads/${nombreArchivo}`;
    }

    const nuevoUsuario = new User({
      nombre,
      email,
      rol,
      password: hashedPassword,
      foto_perfil: fotoRuta,
    });

    await nuevoUsuario.save();

    res.status(200).json({
      message: "Usuario registrado correctamente",
      user: {
        _id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        foto_perfil: nuevoUsuario.foto_perfil,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};