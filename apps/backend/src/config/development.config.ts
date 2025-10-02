// apps/backend/src/config/development.config.ts
import { registerAs } from "@nestjs/config";

export interface DevelopmentConfig {
  enabled: boolean;
  skipAuth: boolean;
  detailedLogs: boolean;
  mockExternalServices: boolean;
  logLevel: string;
  logFormat: 'json' | 'simple';
  logFileEnabled: boolean;
  logFilePath: string;
  logMaxSize: string;
  logMaxFiles: number;
  debugEnabled: boolean;
  debugNamespaces: string;
}

export const developmentConfig = registerAs("development", (): DevelopmentConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    enabled: isDevelopment,
    skipAuth: process.env.DEV_SKIP_AUTH === 'true',
    detailedLogs: process.env.DEV_DETAILED_LOGS === 'true' || isDevelopment,
    mockExternalServices: process.env.DEV_MOCK_EXTERNAL_SERVICES === 'true',
    logLevel: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    logFormat: (process.env.LOG_FORMAT as 'json' | 'simple') || (isDevelopment ? 'simple' : 'json'),
    logFileEnabled: process.env.LOG_FILE_ENABLED === 'true',
    logFilePath: process.env.LOG_FILE_PATH || 'logs/app.log',
    logMaxSize: process.env.LOG_MAX_SIZE || '10m',
    logMaxFiles: parseInt(process.env.LOG_MAX_FILES || '7', 10),
    debugEnabled: process.env.DEBUG_ENABLED === 'true',
    debugNamespaces: process.env.DEBUG_NAMESPACES || 'app:*,auth:*,database:*',
  };
});