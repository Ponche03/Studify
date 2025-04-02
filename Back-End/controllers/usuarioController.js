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






exports.obtenerImagenPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findById(id);
    
    if (!usuario || !usuario.foto_perfil) {
      return res.status(404).json({ error: "Imagen de perfil no encontrada." });
    }
    
    const rutaImagen = path.join(__dirname, "..", usuario.foto_perfil);

    if (!fs.existsSync(rutaImagen)) {
      return res.status(404).json({ error: "Archivo no encontrado." });
    }
    
    const imagenBuffer = fs.readFileSync(rutaImagen);
    const imagenBase64 = imagenBuffer.toString("base64");
    
    res.status(200).json({ imagen: imagenBase64 });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

exports.subirImagenPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const { foto_perfil } = req.body;
    
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    
    if (!foto_perfil) {
      return res.status(400).json({ error: "No se proporcionó ninguna imagen." });
    }
    
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
    usuario.foto_perfil = `/uploads/${nombreArchivo}`;
    await usuario.save();
    
    res.status(200).json({
      message: "Imagen de perfil actualizada correctamente.",
      foto_perfil: usuario.foto_perfil,
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

exports.obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findById(id).select("-password");
    
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

exports.editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, foto_perfil } = req.body;

    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;
    usuario.rol = rol || usuario.rol;
    if (foto_perfil) {
      usuario.foto_perfil = foto_perfil;
    }

    await usuario.save();
    res.status(200).json({ message: "Usuario actualizado correctamente.", usuario });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

exports.borrarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findByIdAndDelete(id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.status(200).json({ message: "Usuario eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor." });
  }
};
