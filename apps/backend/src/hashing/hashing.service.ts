// src/hashing/hashing.service.ts
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HashingService } from './hashing.service.interface';
import { AppLoggerService } from '../common/services/logger.service';

@Injectable()
export class BcryptHashingService implements HashingService {
  private readonly saltRounds: number;
  private readonly logger: AppLoggerService;

  constructor(
    private configService: ConfigService,
    appLoggerService: AppLoggerService
  ) {
    this.logger = appLoggerService.createLogger(BcryptHashingService.name);
    // 确保获取到有效的 saltRounds 值
    this.saltRounds = this.configService.get<number>('HASH_SALT_ROUNDS') || 10;

    if (this.saltRounds < 4) {
      this.logger.warn('HASH_SALT_ROUNDS is too low (<4), may be insecure');
    } else if (this.saltRounds > 14) {
      this.logger.warn('HASH_SALT_ROUNDS is very high (>14), may cause performance issues');
    }
  }

  async hash(password: string): Promise<string> {
    this.logger.debug('开始密码哈希处理');
    if (!password) {
      this.logger.warn('密码不能为空');
      throw new TypeError('Password must not be empty');
    }
    try {
      // 确保 saltRounds 是有效数值
      const rounds = typeof this.saltRounds === 'number' && !isNaN(this.saltRounds) 
        ? this.saltRounds 
        : 10;
        
      const hashedPassword = await bcrypt.hash(password, rounds);
      this.logger.debug('密码哈希处理完成');
      return hashedPassword;
    } catch (err) {
      this.logger.error('密码哈希处理失败', err.stack);
      throw new Error('Password hashing failed');
    }
  }

  async compare(password: string, hash: string): Promise<boolean> {
    this.logger.debug('开始密码比较');
    if (!password || !hash) {
      this.logger.warn('密码或哈希值为空');
      return false;
    }
    try {
      const result = await bcrypt.compare(password, hash);
      this.logger.debug('密码比较完成', undefined, { result });
      return result;
    } catch (err) {
      this.logger.warn('密码比较失败', err.stack);
      return false;
    }
  }
}