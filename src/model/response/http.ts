import { HttpStatus, HttpException } from '@nestjs/common';
import { ApiResponse } from '..';

export const httpStatusOk = (
    msg?: string,
    data?: any
): ApiResponse => {
    return {
        status: {
            code: HttpStatus.OK,
            message: msg ?? 'success'
        },
        data: data
    };
}

export const httpInternalError = (
    msg?: string,
    data?: any
): ApiResponse => {
    return {
        status: {
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message: msg ?? 'internal server error'
        },
        data: data
    };
}

export const httpBadRequest = (
    msg?: string,
    data?: any
): ApiResponse => {
    return {
        status: {
            code: HttpStatus.BAD_REQUEST,
            message: msg ?? 'bad request'
        },
        data: data
    };
}

export const httpUnauthorized = (
    msg?: string,
    data?: any
): ApiResponse => {
    return {
        status: {
            code: HttpStatus.UNAUTHORIZED,
            message: msg ?? 'unauthorized'
        },
        data: data
    };
}

export const httpMaintenanceServer = (
    msg?: string,
    data?: any
) => {
    return {
        status: {
            code: HttpStatus.SERVICE_UNAVAILABLE,
            message: msg ?? 'server is under maintenance'
        },
        data: data
    };
}