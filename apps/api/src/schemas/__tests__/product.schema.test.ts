import { describe, it, expect } from 'vitest'
import { createProductSchema } from '../product.schema.js'

describe('createProductSchema — sanitizacion XSS (CA02)', () => {
  it('limpia <script> en campos de texto libre al parsear', () => {
    const result = createProductSchema.parse({
      nombre: 'Labial <script>alert(1)</script> Matte',
      marca: '<b>LOreal</b>',
      categoria: 'Labiales',
      descripcion: '<img src=x onerror=alert(1)>Descripcion',
    })

    expect(result.nombre).toBe('Labial  Matte')
    expect(result.marca).toBe('LOreal')
    expect(result.descripcion).toBe('Descripcion')
  })

  it('deja pasar texto plano con caracteres de SQL sin alterarlo', () => {
    const result = createProductSchema.parse({
      nombre: "Producto' OR '1'='1",
    })

    expect(result.nombre).toBe("Producto' OR '1'='1")
  })
})
