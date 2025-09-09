"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedException = exports.ValidationException = exports.NotFoundException = exports.BusinessException = exports.AppException = void 0;
class AppException extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.name = this.constructor.name;
    }
}
exports.AppException = AppException;
class BusinessException extends AppException {
    constructor() {
        super(...arguments);
        this.statusCode = 400;
        this.errorCode = 'BUSINESS_RULE_VIOLATION';
    }
}
exports.BusinessException = BusinessException;
class NotFoundException extends AppException {
    constructor(resource, id) {
        super(`${resource} not found${id ? ` with id ${id}` : ''}`);
        this.statusCode = 404;
        this.errorCode = 'NOT_FOUND';
    }
}
exports.NotFoundException = NotFoundException;
class ValidationException extends AppException {
    constructor() {
        super(...arguments);
        this.statusCode = 422;
        this.errorCode = 'VALIDATION_FAILED';
    }
}
exports.ValidationException = ValidationException;
class UnauthorizedException extends AppException {
    constructor(message = 'Authentication required') {
        super(message);
        this.statusCode = 401;
        this.errorCode = 'UNAUTHORIZED';
    }
}
exports.UnauthorizedException = UnauthorizedException;
//# sourceMappingURL=app.exception.js.map