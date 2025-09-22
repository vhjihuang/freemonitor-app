import { Test, TestingModule } from '@nestjs/testing';
import { BcryptHashingService } from './hashing.service';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../common/services/logger.service';

describe('HashingService', () => {
  let service: BcryptHashingService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(10),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BcryptHashingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AppLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<BcryptHashingService>(BcryptHashingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hash = await service.hash(password);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(password);
  });

  it('should compare a password with its hash', async () => {
    const password = 'testPassword123';
    const hash = await service.hash(password);
    const isMatch = await service.compare(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should not match incorrect password', async () => {
    const password = 'testPassword123';
    const wrongPassword = 'wrongPassword123';
    const hash = await service.hash(password);
    const isMatch = await service.compare(wrongPassword, hash);
    expect(isMatch).toBe(false);
  });
});