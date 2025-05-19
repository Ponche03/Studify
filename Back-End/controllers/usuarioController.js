const User = require("../models/usuarioModel");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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

    if (!nombre || !email || !rol || !password) {
      return res.status(400).json({
        error: "Los campos nombre, email, rol y password son requeridos y no pueden ser nulos.",
      });
    }

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

    // Solo puede editarse a sí mismo
    if (req.user.id !== id) {
      return res.status(403).json({
        error: "No tienes permiso para editar este perfil.",
      });
    }

    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;

    // No permitir que se modifique el rol desde aquí
    if (rol && rol !== usuario.rol) {
      return res.status(403).json({
        error: "No está permitido cambiar el rol del usuario.",
      });
    }

    if (foto_perfil) {
      usuario.foto_perfil = foto_perfil;
    }

    await usuario.save();
    res
      .status(200)
      .json({ message: "Usuario actualizado correctamente.", usuario });
  } catch (error) {
    console.error("Error al editar usuario:", error);
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

