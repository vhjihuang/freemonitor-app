import { Module } from "@nestjs/common";
import { BcryptHashingService } from './hashing.service'
import { HASHING_SERVICE } from './hashing.service.token'
@Module({
  providers:[{
    provide: HASHING_SERVICE,
    useClass: BcryptHashingService
  }],
  exports:[HASHING_SERVICE]
})
export class HashingModule {}