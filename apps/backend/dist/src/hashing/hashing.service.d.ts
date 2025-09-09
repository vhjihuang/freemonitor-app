import { ConfigService } from '@nestjs/config';
import { HashingService } from './hashing.service.interface';
export declare class BcryptHashingService implements HashingService {
    private configService;
    private readonly saltRounds;
    private readonly logger;
    constructor(configService: ConfigService);
    hash(password: string): Promise<string>;
    compare(password: string, hash: string): Promise<boolean>;
}
