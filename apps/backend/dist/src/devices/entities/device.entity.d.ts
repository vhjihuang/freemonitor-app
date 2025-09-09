import { Device as SharedDevice } from '@freemonitor/types';
export declare class DeviceEntity implements SharedDevice {
    id: string;
    name: string;
    hostname: string;
    ipAddress?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: Partial<DeviceEntity>);
}
