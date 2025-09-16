import { Module } from "@nestjs/common";
import { BcryptHashingService } from './hashing.service'
import { HASHING_SERVICE } from './hashing.service.token'
import { AppLoggerService } from '../common/services/logger.service'

@Module({
  providers:[{
    provide: HASHING_SERVICE,
    useClass: BcryptHashingService
  },
  AppLoggerService
],
  exports:[HASHING_SERVICE]
})
export class HashingModule {}