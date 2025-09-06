// src/hashing/hashing.service.token.ts
import { InjectionToken } from '@nestjs/common';
import { HashingService } from './hashing.service.interface';

// Symbol 作为唯一标识
export const HASHING_SERVICE: InjectionToken<HashingService> = Symbol('HASHING_SERVICE');