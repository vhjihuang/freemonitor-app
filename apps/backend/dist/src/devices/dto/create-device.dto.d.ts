export declare class CreateDeviceDto {
    name: string;
    ipAddress: string;
    hostname?: string;
    description?: string;
    type?: string;
    location?: string;
    tags?: string[];
    deviceGroupId?: string | null;
}
