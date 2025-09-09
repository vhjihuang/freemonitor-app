export interface SuccessResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
    path: string;
}
export interface ErrorResponse {
    success: boolean;
    statusCode: number;
    message: string;
    errorCode: string;
    timestamp: string;
    path: string;
    details?: unknown;
}
