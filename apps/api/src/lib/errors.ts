export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  // Auth
  UNAUTHORIZED: () =>
    new AppError('UNAUTHORIZED', 'Token JWT ausente o invalido', 401),
  FORBIDDEN: () =>
    new AppError('FORBIDDEN', 'No tienes permiso para esta accion', 403),

  // Inventario
  PRODUCT_NOT_FOUND: () =>
    new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado', 404),
  VARIANT_NOT_FOUND: () =>
    new AppError('VARIANT_NOT_FOUND', 'Variante no encontrada', 404),
  SKU_ALREADY_EXISTS: () =>
    new AppError(
      'SKU_ALREADY_EXISTS',
      'El SKU ya existe para este tenant',
      409
    ),
  CATEGORY_ALREADY_EXISTS: () =>
    new AppError(
      'CATEGORY_ALREADY_EXISTS',
      'La categoría ya existe para este tenant',
      409
    ),

  // Ventas
  INSUFFICIENT_STOCK: () =>
    new AppError(
      'INSUFFICIENT_STOCK',
      'Stock insuficiente para completar la venta',
      409
    ),
  LOCK_NOT_ACQUIRED: () =>
    new AppError(
      'LOCK_NOT_ACQUIRED',
      'No se pudo adquirir el lock del SKU, intenta de nuevo',
      409
    ),
  SALE_NOT_FOUND: () =>
    new AppError('SALE_NOT_FOUND', 'Venta no encontrada', 404),
  SALE_ALREADY_CANCELLED: () =>
    new AppError('SALE_ALREADY_CANCELLED', 'La venta ya fue cancelada', 409),

  // General
  NOT_FOUND: (resource: string) =>
    new AppError('NOT_FOUND', `${resource} no encontrado`, 404),
  INTERNAL_ERROR: () =>
    new AppError('INTERNAL_ERROR', 'Error interno del servidor', 500),
  BAD_GATEWAY: () =>
    new AppError('BAD_GATEWAY', 'Falla en dependencia externa', 502),
} as const
