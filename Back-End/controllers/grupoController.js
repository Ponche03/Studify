const Grupo = require("../models/grupoModel");
const User = require("../models/usuarioModel");

exports.crearGrupo = async (req, res) => {
    try {
        const { nombre, descripcion, maestro_id } = req.body;

        // Verificar si el maestro existe y su rol es "maestro"
        const maestro = await User.findById(maestro_id);
        if (!maestro || maestro.rol !== "maestro") {
            return res.status(400).json({ error: "El maestro no existe o no tiene el rol adecuado." });
        }

        // Crear un nuevo grupo
        const nuevoGrupo = new Grupo({
            nombre,
            descripcion,
            maestro_id,
            alumnos: [] // Inicialmente sin alumnos
        });

        // Guardar en la base de datos
        await nuevoGrupo.save();

        // Responder con el grupo creado
        res.status(200).json({
            message: "Grupo creado exitosamente",
            group: {
                _id: nuevoGrupo._id,
                nombre: nuevoGrupo.nombre,
                descripcion: nuevoGrupo.descripcion,
                maestro_id: nuevoGrupo.maestro_id,
                alumnos: nuevoGrupo.alumnos
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

exports.añadirAlumnoAGrupo = async (req, res) => {
    try {
      const { group_id } = req.params;
      const { alumno_id } = req.body;
  
      // Verificar si el grupo existe
      const group = await Group.findById(group_id);
      if (!group) {
        return res.status(404).json({ error: "El grupo no existe." });
      }
  
      // Verificar si el alumno existe
      const student = await User.findById(alumno_id);
      if (!student || student.rol !== "alumno") {
        return res.status(400).json({ error: "El alumno no existe o no tiene el rol adecuado." });
      }
  
      // Verificar si el alumno ya está en el grupo
      if (group.alumnos.includes(alumno_id)) {
        return res.status(400).json({ error: "El alumno ya está en este grupo." });
      }
  
      // Agregar el alumno al grupo
      group.alumnos.push(alumno_id);
      await group.save();
  
      res.status(200).json({
        message: "Alumno agregado exitosamente",
        grupo_id: group._id,
        alumnos: group.alumnos
      });
    } catch (error) {
      res.status(500).json({ error: "Error interno del servidor." });
    }
  };

  exports.archivarGrupo = async (req, res) => {
    try {
        const { id } = req.params;

        const grupo = await Grupo.findByIdAndUpdate(
            id,
            { archivado: true },
            { new: true }
        );

        if (!grupo) {
            return res.status(404).json({ error: "Grupo no encontrado" });
        }

        res.status(200).json({
            message: "Grupo archivado",
            group: {
                _id: grupo._id,
                archivado: grupo.archivado
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

