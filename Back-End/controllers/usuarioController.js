const User = require("../models/usuarioModel");
const admin = require("../utils/firebaseAdmin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
exports.logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user;

    // Buscar usuario en tu base de datos
    user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "E-mail o contraseña inválidos" });
    }

    let isSocialLogin = false;

    // Intenta verificar si el "password" es un token de Firebase
    try {
      const decodedFirebase = await admin.auth().verifyIdToken(password); // token Firebase como password
      if (decodedFirebase.email === email) {
        isSocialLogin = true;
      }
    } catch (err) {
      isSocialLogin = false;
    }

    if (!isSocialLogin) {
      // Login tradicional
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "E-mail o contraseña inválidos" });
      }
    }

    // Generar token JWT propio
    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

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
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

exports.registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, rol, password, foto_perfil } = req.body;

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: "Ya existe el nombre de usuario." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new User({
      nombre,
      email,
      rol,
      password: hashedPassword,
      foto_perfil: foto_perfil || null,
    });

    await nuevoUsuario.save();

    const token = jwt.sign(
      { id: nuevoUsuario._id, rol: nuevoUsuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Usuario registrado correctamente",
      token,
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

exports.obtenerUsuariosPorBusqueda = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: "El parámetro 'q' es requerido." });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Búsqueda parcial insensible a mayúsculas/minúsculas en 'nombre' o 'email'
    const filter = {
       rol: "alumno",
      $or: [
        { nombre: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    };

    const [usuarios, total] = await Promise.all([
      User.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password"),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      results: usuarios,
      total,
      page: parseInt(page),
      hasMore: skip + usuarios.length < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

