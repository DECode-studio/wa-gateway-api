import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from 'express';
import { ApiResponse } from "src/model";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception.getResponse() as
            | { message?: string | string[]; error?: string }
            | string;

        let message: string;

        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        } else if (Array.isArray(exceptionResponse?.message)) {
            message = exceptionResponse.message.join(', ');
        } else {
            message = exceptionResponse?.message || exceptionResponse?.error || 'Error';
        }

        const apiResponse: ApiResponse = {
            status: {
                code: status,
                message,
            },
        };

        response.status(status).json(apiResponse);
    }
}