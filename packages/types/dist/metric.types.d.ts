export interface Metric {
    id: number;
    deviceId: string;
    cpu: number;
    memory: number;
    disk: number;
    timestamp: Date;
}
export interface CreateMetricDto {
    deviceId: string;
    cpu: number;
    memory: number;
    disk: number;
    timestamp?: Date;
}
