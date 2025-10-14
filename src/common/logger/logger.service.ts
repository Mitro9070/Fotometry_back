import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info) => {
        return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message} ${
          info.stack ? '\n' + info.stack : ''
        }`;
      })
    );

    this.logger = winston.createLogger({
      level: 'debug',
      format: logFormat,
      transports: [
        // Консоль - только для разработки
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf((info) => {
              return `${info.timestamp} [${info.level}] ${info.message} ${
                info.stack ? '\n' + info.stack : ''
              }`;
            })
          ),
        }),

        // Ежедневная ротация файлов для всех логов
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),

        // Отдельный файл для ошибок
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
        }),

        // Отдельный файл для парсинга
        new DailyRotateFile({
          filename: 'logs/parsing-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Специальные методы для различных типов логов
  logParsing(message: string, data?: any) {
    this.logger.info(message, { 
      type: 'parsing', 
      data,
      timestamp: new Date().toISOString()
    });
  }

  logDatabase(message: string, query?: string, params?: any[]) {
    this.logger.info(message, { 
      type: 'database', 
      query, 
      params,
      timestamp: new Date().toISOString()
    });
  }

  logApiRequest(method: string, url: string, body?: any, headers?: any) {
    this.logger.info(`${method} ${url}`, { 
      type: 'api_request', 
      method, 
      url, 
      body, 
      headers,
      timestamp: new Date().toISOString()
    });
  }

  logApiResponse(statusCode: number, message: string, data?: any) {
    this.logger.info(`Response: ${statusCode} ${message}`, { 
      type: 'api_response', 
      statusCode, 
      message, 
      data,
      timestamp: new Date().toISOString()
    });
  }

  logError(error: Error, context?: string, additionalData?: any) {
    this.logger.error('Application Error', {
      type: 'application_error',
      message: error.message,
      stack: error.stack,
      context,
      additionalData,
      timestamp: new Date().toISOString()
    });
  }
}

