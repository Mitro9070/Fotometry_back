import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 50 * 1024 * 1024, // 50MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
}));

export const appConfig = {
  PORT: process.env.PORT || 5000,
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '50mb',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
