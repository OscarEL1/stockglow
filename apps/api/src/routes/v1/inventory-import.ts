import type { FastifyInstance } from 'fastify'
import * as XLSX from 'xlsx'
import { prisma } from '../../lib/prisma.js'
import { successResponse } from '../../lib/response.js'
import { Errors } from '../../lib/errors.js'

const EXPECTED_COLUMNS = [
  'producto_nombre',
  'producto_marca',
  'producto_categoria',
  'producto_descripcion',
  'variante_nombre',
  'sku',
  'precio_venta',
  'stock_actual',
  'stock_minimo',
  'fecha_caducidad',
  'imagen_url',
] as const

type ImportColumn = (typeof EXPECTED_COLUMNS)[number]
type ImportRow = Record<ImportColumn, string>

interface ImportRowError {
  fila: number
  campo: string
  valor: string
  motivo: string
}

function toText(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return String(value ?? '').trim()
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function createProductKey(
  nombre: string,
  marca: string,
  categoria: string
): string {
  return [
    normalizeText(nombre),
    normalizeText(marca),
    normalizeText(categoria),
  ].join('|')
}

function parseNumericValue(value: string): number {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.')
  return Number(normalized)
}

function parseDateValue(value: string): Date | null {
  if (!value) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null
  }

  return date
}

function isValidUrl(value: string): boolean {
  if (!value) return true

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function sendInvalidFormat(reply: any, message: string) {
  return reply.status(422).send({
    success: false,
    error: {
      code: 'INVALID_IMPORT_FORMAT',
      message,
      statusCode: 422,
      expectedColumns: EXPECTED_COLUMNS,
    },
  })
}

export async function inventoryImportRoutes(fastify: FastifyInstance) {
  // POST /api/v1/inventory/import
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { tenantId, orgRole } = request

      if (orgRole !== 'org:admin') {
        throw Errors.FORBIDDEN()
      }

      const uploadedFile = await request.file()

      if (!uploadedFile) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'IMPORT_FILE_REQUIRED',
            message: 'Selecciona un archivo CSV o Excel',
            statusCode: 400,
          },
        })
      }

      const extension =
        uploadedFile.filename.split('.').pop()?.toLowerCase() ?? ''

      const allowedExtensions = ['csv', 'xlsx', 'xls']

      if (!allowedExtensions.includes(extension)) {
        return reply.status(415).send({
          success: false,
          error: {
            code: 'UNSUPPORTED_IMPORT_FILE',
            message: 'El archivo debe tener extensión .csv, .xlsx o .xls',
            statusCode: 415,
            expectedColumns: EXPECTED_COLUMNS,
          },
        })
      }

      const buffer = await uploadedFile.toBuffer()

      let workbook: XLSX.WorkBook

      try {
        workbook = XLSX.read(buffer, {
          type: 'buffer',
          cellDates: true,
        })
      } catch {
        return sendInvalidFormat(
          reply,
          'No se pudo leer el archivo. Verifica que sea un CSV o Excel válido.'
        )
      }

      const firstSheetName = workbook.SheetNames[0]

      if (!firstSheetName) {
        return sendInvalidFormat(reply, 'El archivo no contiene hojas o datos.')
      }

      const worksheet = workbook.Sheets[firstSheetName]

      const matrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
        raw: true,
      }) as unknown[][]

      if (matrix.length === 0) {
        return sendInvalidFormat(reply, 'El archivo está vacío.')
      }

      const headers = matrix[0].map((value, index) => {
        const header = toText(value)

        return index === 0 ? header.replace(/^\uFEFF/, '') : header
      })

      const hasExpectedHeaders =
        headers.length === EXPECTED_COLUMNS.length &&
        EXPECTED_COLUMNS.every(
          (expectedColumn, index) => headers[index] === expectedColumn
        )

      if (!hasExpectedHeaders) {
        return sendInvalidFormat(
          reply,
          `Formato incorrecto. Las columnas esperadas son: ${EXPECTED_COLUMNS.join(
            ', '
          )}`
        )
      }

      const tenant = await prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },
        select: {
          stockMinimoGlobal: true,
        },
      })

      if (!tenant) {
        throw Errors.NOT_FOUND('Tienda')
      }

      /*
       * Cargamos productos y SKU existentes para evitar consultas repetitivas
       * durante la importación.
       */
      const [existingProducts, existingVariants] = await Promise.all([
        prisma.producto.findMany({
          where: {
            tenantId,
          },
          select: {
            id: true,
            nombre: true,
            marca: true,
            categoria: true,
          },
        }),

        prisma.varianteProducto.findMany({
          where: {
            tenantId,
          },
          select: {
            sku: true,
          },
        }),
      ])

      const productCache = new Map<string, string>()

      for (const product of existingProducts) {
        const productKey = createProductKey(
          product.nombre,
          product.marca ?? '',
          product.categoria ?? ''
        )

        productCache.set(productKey, product.id)
      }

      const existingSkuSet = new Set(
        existingVariants.map((variant) => normalizeText(variant.sku))
      )

      const errors: ImportRowError[] = []

      let totalRows = 0
      let importedRows = 0
      let failedRows = 0
      let createdProducts = 0
      let createdVariants = 0

      const dataRows = matrix.slice(1)

      /*
       * Cada fila representa una variante.
       * El índice + 2 representa la fila real del archivo:
       * fila 1 = encabezados.
       */
      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const rawValues = dataRows[rowIndex]
        const fileRowNumber = rowIndex + 2

        const isEmptyRow = rawValues.every((value) => toText(value) === '')

        if (isEmptyRow) {
          continue
        }

        totalRows++

        const row = Object.fromEntries(
          EXPECTED_COLUMNS.map((column, columnIndex) => [
            column,
            toText(rawValues[columnIndex]),
          ])
        ) as ImportRow

        const rowErrors: ImportRowError[] = []

        const addRowError = (campo: string, valor: string, motivo: string) => {
          rowErrors.push({
            fila: fileRowNumber,
            campo,
            valor,
            motivo,
          })
        }

        if (!row.producto_nombre) {
          addRowError(
            'producto_nombre',
            row.producto_nombre,
            'El nombre del producto es obligatorio'
          )
        } else if (row.producto_nombre.length > 150) {
          addRowError(
            'producto_nombre',
            row.producto_nombre,
            'El nombre del producto no puede superar 150 caracteres'
          )
        }

        if (row.producto_marca.length > 50) {
          addRowError(
            'producto_marca',
            row.producto_marca,
            'La marca no puede superar 50 caracteres'
          )
        }

        if (row.producto_categoria.length > 50) {
          addRowError(
            'producto_categoria',
            row.producto_categoria,
            'La categoría no puede superar 50 caracteres'
          )
        }

        if (!row.variante_nombre) {
          addRowError(
            'variante_nombre',
            row.variante_nombre,
            'El nombre de la variante es obligatorio'
          )
        } else if (row.variante_nombre.length > 100) {
          addRowError(
            'variante_nombre',
            row.variante_nombre,
            'El nombre de la variante no puede superar 100 caracteres'
          )
        }

        if (!row.sku) {
          addRowError('sku', row.sku, 'El SKU es obligatorio')
        } else if (row.sku.length > 50) {
          addRowError('sku', row.sku, 'El SKU no puede superar 50 caracteres')
        } else if (existingSkuSet.has(normalizeText(row.sku))) {
          addRowError(
            'sku',
            row.sku,
            'El SKU ya existe en esta tienda o está repetido en el archivo'
          )
        }

        const price = parseNumericValue(row.precio_venta)

        if (!row.precio_venta || !Number.isFinite(price) || price <= 0) {
          addRowError(
            'precio_venta',
            row.precio_venta,
            'El precio debe ser un número mayor que cero'
          )
        }

        const currentStock = row.stock_actual
          ? parseNumericValue(row.stock_actual)
          : 0

        if (!Number.isInteger(currentStock) || currentStock < 0) {
          addRowError(
            'stock_actual',
            row.stock_actual,
            'El stock actual debe ser un número entero mayor o igual a cero'
          )
        }

        const minimumStock = row.stock_minimo
          ? parseNumericValue(row.stock_minimo)
          : tenant.stockMinimoGlobal

        if (!Number.isInteger(minimumStock) || minimumStock < 0) {
          addRowError(
            'stock_minimo',
            row.stock_minimo,
            'El stock mínimo debe ser un número entero mayor o igual a cero'
          )
        }

        let expirationDate: Date | null = null

        if (row.fecha_caducidad) {
          expirationDate = parseDateValue(row.fecha_caducidad)

          if (!expirationDate) {
            addRowError(
              'fecha_caducidad',
              row.fecha_caducidad,
              'La fecha debe usar el formato YYYY-MM-DD'
            )
          }
        }

        if (!isValidUrl(row.imagen_url)) {
          addRowError(
            'imagen_url',
            row.imagen_url,
            'La imagen debe contener una URL válida'
          )
        }

        if (rowErrors.length > 0) {
          failedRows++
          errors.push(...rowErrors)
          continue
        }

        const productKey = createProductKey(
          row.producto_nombre,
          row.producto_marca,
          row.producto_categoria
        )

        const cachedProductId = productCache.get(productKey)

        try {
          const result = await prisma.$transaction(async (tx) => {
            let productId = cachedProductId
            let productWasCreated = false

            if (!productId) {
              const createdProduct = await tx.producto.create({
                data: {
                  tenantId,
                  nombre: row.producto_nombre,
                  marca: row.producto_marca || null,
                  categoria: row.producto_categoria || null,
                  descripcion: row.producto_descripcion || null,
                },
                select: {
                  id: true,
                },
              })

              productId = createdProduct.id
              productWasCreated = true
            }

            await tx.varianteProducto.create({
              data: {
                tenantId,
                productoId: productId,
                sku: row.sku,
                nombreVariante: row.variante_nombre,
                imagenUrl: row.imagen_url || null,
                precioVenta: price,
                stockActual: currentStock,
                stockMinimo: minimumStock,
                fechaCaducidad: expirationDate,
              },
            })

            return {
              productId,
              productWasCreated,
            }
          })

          if (result.productWasCreated) {
            createdProducts++
            productCache.set(productKey, result.productId)
          }

          existingSkuSet.add(normalizeText(row.sku))

          importedRows++
          createdVariants++
        } catch (error: any) {
          failedRows++

          const duplicateSku = error?.code === 'P2002'

          errors.push({
            fila: fileRowNumber,
            campo: duplicateSku ? 'sku' : 'fila',
            valor: duplicateSku ? row.sku : '',
            motivo: duplicateSku
              ? 'El SKU ya existe en esta tienda'
              : 'No se pudo guardar esta fila',
          })

          fastify.log.error(
            {
              error,
              fileRowNumber,
              sku: row.sku,
            },
            'Error procesando fila de importación'
          )
        }
      }

      if (totalRows === 0) {
        return sendInvalidFormat(
          reply,
          'El archivo no contiene filas de productos.'
        )
      }

      return reply.send(
        successResponse({
          archivo: uploadedFile.filename,
          totalFilas: totalRows,
          filasImportadas: importedRows,
          filasFallidas: failedRows,
          productosCreados: createdProducts,
          variantesCreadas: createdVariants,
          errores: errors,
          columnasEsperadas: EXPECTED_COLUMNS,
        })
      )
    }
  )
}
