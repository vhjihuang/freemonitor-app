export abstract class AppException extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly timestamp: string = new Date().toISOString();
  
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BusinessException extends AppException {
  readonly statusCode = 400;
  readonly errorCode = 'BUSINESS_RULE_VIOLATION';
}

export class NotFoundException extends AppException {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';
  
  constructor(resource: string, id?: string) {
    super(`${resource} not found${id ? ` with id ${id}` : ''}`);
  }
}

export class ValidationException extends AppException {
  readonly statusCode = 422;
  readonly errorCode = 'VALIDATION_FAILED';
}

export class UnauthorizedException extends AppException {
  readonly statusCode = 401;
  readonly errorCode = 'UNAUTHORIZED';
  
  constructor(message = 'Authentication required') {
    super(message);
  }
}