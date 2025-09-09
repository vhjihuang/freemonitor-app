export declare abstract class AppException extends Error {
    readonly details?: unknown;
    abstract readonly statusCode: number;
    abstract readonly errorCode: string;
    readonly timestamp: string;
    constructor(message: string, details?: unknown);
}
export declare class BusinessException extends AppException {
    readonly statusCode = 400;
    readonly errorCode = "BUSINESS_RULE_VIOLATION";
}
export declare class NotFoundException extends AppException {
    readonly statusCode = 404;
    readonly errorCode = "NOT_FOUND";
    constructor(resource: string, id?: string);
}
export declare class ValidationException extends AppException {
    readonly statusCode = 422;
    readonly errorCode = "VALIDATION_FAILED";
}
export declare class UnauthorizedException extends AppException {
    readonly statusCode = 401;
    readonly errorCode = "UNAUTHORIZED";
    constructor(message?: string);
}
