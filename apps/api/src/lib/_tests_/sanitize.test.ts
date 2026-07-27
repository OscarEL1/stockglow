import { describe, it, expect } from 'vitest'
import { sanitizeText, sanitizeRichText } from '../../utils/sanitize.js'

/*
 * HU-095 — prueba de penetracion basica (CA02): valida que los dos
 * casos del ticket se comporten como se documento en el diagnostico.
 */
describe('sanitizeText (CA02 — XSS)', () => {
  it('elimina tags <script> y su contenido ejecutable', () => {
    const result = sanitizeText('<script>alert(1)</script>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert(1)')
  })

  it('elimina cualquier tag HTML manteniendo el texto plano', () => {
    const result = sanitizeText('<img src=x onerror=alert(1)>Labial rojo')
    expect(result).toBe('Labial rojo')
    expect(result).not.toContain('onerror')
  })

  it(
    'no aplica a inyeccion SQL — no hay queries raw en el proyecto ' +
      '(ver lib/prisma.ts), Prisma parametriza automaticamente el ' +
      'Query Builder, por lo que el string se mantiene como texto plano',
    () => {
      const sqlInjection = "' OR '1'='1"
      const result = sanitizeText(sqlInjection)
      expect(result).toBe(sqlInjection)
    }
  )

  it('recorta espacios y no altera texto legitimo', () => {
    expect(sanitizeText('  Labial Matte  ')).toBe('Labial Matte')
  })
})

describe('sanitizeRichText (CA02 — HTML limitado)', () => {
  it('permite tags de formato basico', () => {
    const result = sanitizeRichText('<b>Oferta</b> por tiempo limitado')
    expect(result).toBe('<b>Oferta</b> por tiempo limitado')
  })

  it('elimina scripts aunque esten mezclados con tags permitidos', () => {
    const result = sanitizeRichText('<b>Hola</b><script>alert(1)</script>')
    expect(result).toBe('<b>Hola</b>')
  })
})
