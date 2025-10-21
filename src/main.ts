import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  // Получаем логгер из DI контейнера
  const logger = app.get(LoggerService);
  
  // Устанавливаем наш логгер как глобальный
  app.useLogger(logger);

  // Глобальный фильтр исключений
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  // Глобальный префикс API
  app.setGlobalPrefix('api/v1');

  // Валидация
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // CORS
  app.enableCors();

  // Swagger документация
  const config = new DocumentBuilder()
    .setTitle('Fotometry Backend API')
    .setDescription('API для системы сбора, хранения и обработки фотометрической информации об ИСЗ')
    .setVersion('1.0')
    .addTag('Satellites - Каталог', 'Поиск и получение данных из каталога TLE спутников')
    .addTag('Satellites - База данных', 'Управление спутниками в базе данных')
    .addTag('Ingest - Загрузка данных', 'Загрузка и обработка файлов наблюдений')
    .addTag('Observations - Наблюдения', 'Управление наблюдениями и данными')
    .addTag('Analytics - Аналитика', 'Аналитика и статистика по наблюдениям')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = 5000;
  
  try {
    logger.log(`📡 Попытка запуска сервера на порту ${port}...`, 'Bootstrap');
    logger.log(`   Host: 0.0.0.0`, 'Bootstrap');
    
    const server = await app.listen(port, '0.0.0.0');
    
    logger.log(`✅ Server.listen() выполнен успешно`, 'Bootstrap');
    logger.log(`   Server address: ${JSON.stringify(server.address())}`, 'Bootstrap');
    logger.log(`🚀 Приложение запущено на порту ${port}`, 'Bootstrap');
    logger.log(`📚 Swagger документация доступна по адресу: http://localhost:${port}/api/docs`, 'Bootstrap');
    
    // Проверка что порт действительно слушается
    setTimeout(() => {
      logger.log(`🔍 Проверка через 2 секунды...`, 'Bootstrap');
    }, 2000);
    
  } catch (error) {
    logger.error(`💥💥💥 КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ 💥💥💥`, '', 'Bootstrap');
    logger.error(`Ошибка: ${error.message}`, '', 'Bootstrap');
    logger.error(`Стек: ${error.stack}`, '', 'Bootstrap');
    console.error('💥💥💥 ОШИБКА BOOTSTRAP:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('💥💥💥 ОШИБКА BOOTSTRAP:', error);
  process.exit(1);
});
