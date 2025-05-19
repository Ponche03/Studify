const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }), // capturar stack traces
    logFormat
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),     // errores
    new transports.File({ filename: 'logs/combined.log' })                   // todo
  ],
});


module.exports = logger;
