const Tarea = require('../models/tareaModel');

async function actualizarTareasVencidas() {
  try {
    const ahora = new Date();
    
    const resultado = await Tarea.updateMany(
      {
        estatus: 'Abierta',
        fecha_vencimiento: { $lt: ahora }
      },
      { $set: { estatus: 'Cerrada' } }
    );

    console.log(`Al iniciar: ${resultado.modifiedCount} tareas expiradas actualizadas.`);
  } catch (error) {
    console.error('Error al actualizar tareas vencidas al iniciar el servidor:', error);
  }
}

module.exports = actualizarTareasVencidas;