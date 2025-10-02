// apps/backend/src/development/development.module.ts
import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerService } from '../common/services/logger.service';
import { developmentConfig } from '../config/development.config';
import { jwtConfig, devUserConfig } from '../config/jwt.config';
import { DevelopmentService } from './development.service';
import { DevelopmentController } from './development.controller';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(developmentConfig),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(devUserConfig),
  ],
  providers: [AppLoggerService, DevelopmentService],
  controllers: [DevelopmentController],
  exports: [AppLoggerService, DevelopmentService],
})
export class DevelopmentModule implements OnModuleInit {
  constructor(
    private readonly logger: AppLoggerService,
  ) {}

  onModuleInit() {
    this.logDevelopmentEnvironment();
  }

  /**
   * 记录开发环境信息
   */
  private logDevelopmentEnvironment(): void {
    const config = this.logger.getLogConfig();
    
    this.logger.log('🚀 开发环境初始化完成', 'DevelopmentModule', {
      nodeEnv: process.env.NODE_ENV,
      logLevel: config.level,
      logFormat: config.format,
      debugEnabled: config.debugEnabled,
      timestamp: new Date().toISOString(),
    });

    // 记录内存使用情况
    this.logger.logMemoryUsage('DevelopmentModule');

    // 记录环境变量摘要（不包含敏感信息）
    this.logger.devDebug('环境变量摘要', 'DevelopmentModule', {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      databaseUrl: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
      redisHost: process.env.REDIS_HOST,
      frontendUrl: process.env.FRONTEND_URL,
    });
  }
}