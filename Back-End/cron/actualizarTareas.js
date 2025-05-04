const cron = require('node-cron');
const Tarea = require('../models/tareaModel'); 

// Ejecuta todos los días a las 00:00
cron.schedule('0 0 * * *', async () => {
  try {
    const ahora = new Date();

    const resultado = await Tarea.updateMany(
      {
        estatus: 'Abierta',
        fecha_vencimiento: { $lt: ahora }
      },
      { $set: { estatus: 'Cerrada' } } 
    );

    console.log(`${resultado.modifiedCount} tareas expiradas modificadas automáticamente.`);
  } catch (error) {
    console.error('Error al actualizar tareas vencidas:', error);
  }
});
