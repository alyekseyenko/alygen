import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getRequestId } from './async-context.js';

/**
 * Senior Logger Service
 * Categoriza logs por data, nível, ambiente e Request Correlation ID
 * Em conformidade com RGPD (mascaramento de PII e retenção/rotação de logs)
 */
const injectRequestId = winston.format((info) => {
  const reqId = getRequestId();
  if (reqId) {
    info.requestId = reqId;
  }
  return info;
});

const maskPII = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = info.message
      .replace(/([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g, '$1***@$2')
      .replace(/\b([1235689]\d)\d{5}(\d{2})\b/g, '$1*****$2')
      .replace(/\bPT50\d{21}\b/gi, 'PT50*******************');
  }
  return info;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    injectRequestId(),
    maskPII(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'alygen-backend' },
  transports: [
    // 1. Erros graves vão para um ficheiro com rotação
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    // 2. Todos os logs vão para o log combinado com rotação
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
  ],
});

// Em desenvolvimento, também queremos logs coloridos no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;
