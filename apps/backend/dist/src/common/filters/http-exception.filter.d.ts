import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: any, host: ArgumentsHost): Response<any, Record<string, any>>;
}
