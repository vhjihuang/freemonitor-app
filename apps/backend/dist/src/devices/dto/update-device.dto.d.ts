import { UpdateDeviceDto as SharedUpdateDeviceDto } from '@freemonitor/types';
import { CreateDeviceDto } from './create-device.dto';
declare const UpdateDeviceDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateDeviceDto>>;
export declare class UpdateDeviceDto extends UpdateDeviceDto_base implements SharedUpdateDeviceDto {
}
export {};
