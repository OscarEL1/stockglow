export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
      ...meta,
    },
  }
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number
) {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
    },
  }
}
