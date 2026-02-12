import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: { field: string; message: string }[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body.message as string) || message;
        error = (body.error as string) || error;
        if (Array.isArray(body.message)) {
          details = body.message.map((msg: string) => ({ field: 'unknown', message: msg }));
          message = 'Validation failed';
        }
      }
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      details,
      correlationId: request.headers['x-correlation-id'],
      timestamp: new Date().toISOString(),
    });
  }
}
