// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用 CORS（方便前端连接）
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  await app.listen(process.env.PORT || 3001);
  console.log(`🚀 Backend server running on http://localhost:3001`);
}
bootstrap();