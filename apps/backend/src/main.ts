// apps/backend/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe, BadRequestException } from "@nestjs/common";
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

  // 启用 CORS（方便前端连接）
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["https://freemonitor-app-frontend.vercel.app","http://localhost:3000","http://localhost:3001"],
  });

  await app.listen(process.env.PORT || 3001);
  console.log(`🚀 Backend server running on http://localhost:3001`);
}
bootstrap();
