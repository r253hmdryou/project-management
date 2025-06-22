interface ExceptionResponse {
  statusCode: number;
  message: string;
}

export function conflictException(message: string): ExceptionResponse {
  return {
    statusCode: 409,
    message,
  };
}
