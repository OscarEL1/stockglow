import sanitizeHtml from 'sanitize-html'

/*
 * Elimina cualquier tag/atributo HTML. Para campos de texto plano
 * (nombre, marca, categoria, motivo, etc.) donde no se espera markup.
 */
export function sanitizeText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()
}

/*
 * Permite un set minimo de tags de formato para campos que si
 * aceptan HTML enriquecido (ej. descripciones largas con negritas/listas).
 */
export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
  }).trim()
}
