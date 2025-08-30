// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ 1. 启用全局 DTO 验证（非常重要！）
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // 自动去除 DTO 中不存在的字段
    forbidNonWhitelisted: true, // 遇到非法字段抛 400 错误
    transform: true,        // 自动将 JSON 转为 DTO 类实例（类型转换）
    transformOptions: {
      enableImplicitConversion: true, // 支持字符串转数字等隐式转换
    },
    // disableErrorMessages: false, // 生产环境可关闭详细错误
  }));
  
  // 启用 CORS（方便前端连接）
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  await app.listen(process.env.PORT || 3001);
  console.log(`🚀 Backend server running on http://localhost:3001`);
}
bootstrap();