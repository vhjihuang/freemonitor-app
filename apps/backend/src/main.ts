// apps/backend/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe, BadRequestException } from "@nestjs/common";
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ 1. 启用全局 DTO 验证（非常重要！）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return `${error.property}: ${constraints.join(", ")}`;
        });

        Logger.warn(`400- Validation Failed: ${messages.join("; ")}`, "Validation");

        return new BadRequestException(messages);
      },
      // disableErrorMessages: false,
    })
  );

  // ✅ 2. 注册全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 启用 CORS（方便前端连接）
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["https://freemonitor-app-frontend.vercel.app","http://localhost:3000","http://localhost:3001"],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 Backend server running on http://localhost:${port}`, "Bootstrap");
}
bootstrap();
