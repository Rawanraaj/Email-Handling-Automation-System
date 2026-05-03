import winston from "winston";

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "azlor",
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "development"
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : winston.format.json(),
    }),
  ],
});

export const log = {
  info: (message: string, meta?: object) => logger.info(message, meta),
  warn: (message: string, meta?: object) => logger.warn(message, meta),
  error: (message: string, error?: unknown, meta?: object) => {
    logger.error(message, {
      ...meta,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
  },
  debug: (message: string, meta?: object) => logger.debug(message, meta),
  security: (event: string, userId: string, meta?: object) =>
    logger.warn(`SECURITY: ${event}`, { userId, ...meta }),
};

export default logger;
