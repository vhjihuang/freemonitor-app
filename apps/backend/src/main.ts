// apps/backend/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, BadRequestException } from "@nestjs/common";
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppLoggerService } from './common/services/logger.service';

async function bootstrap() {
  // 创建应用实例
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // 获取配置服务和日志服务
  const configService = app.get(ConfigService);
  const logger = app.get(AppLoggerService).createLogger('Bootstrap');
  
  // 设置应用使用自定义日志服务
  app.useLogger(logger);

  // ✅ 1. 安全增强 - 使用helmet设置HTTP安全头
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // ✅ 2. 启用全局 DTO 验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const validationLogger = app.get(AppLoggerService).createLogger('Validation');
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return `${error.property}: ${constraints.join(", ")}`;
        });

        validationLogger.warn(`400- 验证失败: ${messages.join("; ")}`);
        return new BadRequestException(messages);
      },
    })
  );

  // ✅ 3. 注册全局异常过滤器
  // HttpExceptionFilter已经在CommonModule中通过APP_FILTER提供，无需在此处手动注册

  // ✅ 4. 注册全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ✅ 5. 启用 CORS
  const corsOrigins = process.env.CORS_ORIGIN?.split(",") || [
    "https://freemonitor-app-frontend.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
  ];
  
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  });

  // ✅ 6. 设置API前缀
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // ✅ 7. 启动服务器
  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);
  
  const appUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
  logger.log(`🚀 后端服务器已启动`, undefined, {
    url: appUrl,
    apiPrefix: apiPrefix,
    environment: process.env.NODE_ENV,
    corsOrigins: corsOrigins,
  });

  // 记录安全配置信息
  if (process.env.NODE_ENV === 'development') {
    logger.debug('安全配置已应用', undefined, {
      helmetEnabled: true,
      validationPipeEnabled: true,
      globalExceptionFilterEnabled: true,
      globalResponseInterceptorEnabled: true,
      corsEnabled: true,
    });
  }
}

// 启动应用并处理可能的错误
bootstrap().catch((error) => {
  const configService = new ConfigService();
  const logger = new AppLoggerService(configService);
  const bootstrapLogger = logger.createLogger('Bootstrap');
  bootstrapLogger.error('应用启动失败', error.stack, undefined, {
    errorType: error.constructor.name,
    errorMessage: error.message,
    environment: process.env.NODE_ENV,
  });
  process.exit(1);
});