interface ExceptionResponse {
  statusCode: number;
  message: string;
}

export function notFoundException(message: string): ExceptionResponse {
  return {
    statusCode: 404,
    message,
  };
}

export function conflictException(message: string): ExceptionResponse {
  return {
    statusCode: 409,
    message,
  };
}
