// src/hashing/hashing.service.ts
import * as bcrypt from 'bcrypt';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HashingService } from './hashing.service.interface';

@Injectable()
export class BcryptHashingService implements HashingService {
  private readonly saltRounds: number;
  private readonly logger = new Logger(BcryptHashingService.name);

  constructor(private configService: ConfigService) {
    this.saltRounds = this.configService.get<number>('HASH_SALT_ROUNDS', 10);

    if (this.saltRounds < 4) {
      this.logger.warn('HASH_SALT_ROUNDS is too low (<4), may be insecure');
    } else if (this.saltRounds > 14) {
      this.logger.warn('HASH_SALT_ROUNDS is very high (>14), may cause performance issues');
    }
  }

  async hash(password: string): Promise<string> {
    if (!password) {
      throw new TypeError('Password must not be empty');
    }
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (err) {
      this.logger.error('Hashing failed', err.stack);
      throw new Error('Password hashing failed');
    }
  }

  async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    try {
      return await bcrypt.compare(password, hash);
    } catch (err) {
      this.logger.warn('Compare failed', err.stack);
      return false;
    }
  }
}