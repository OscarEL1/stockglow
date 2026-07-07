import type { FastifyInstance } from 'fastify'
import { Webhook } from 'svix'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../lib/env.js'
import { successResponse } from '../../lib/response.js'

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/clerk',
    { config: { rawBody: true } },
    async (request: any, reply) => {
      const svixId = request.headers['svix-id']
      const svixTimestamp = request.headers['svix-timestamp']
      const svixSignature = request.headers['svix-signature']

      if (!svixId || !svixTimestamp || !svixSignature) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'MISSING_HEADERS',
            message: 'Headers de webhook faltantes',
            statusCode: 400,
          },
        })
      }

      const wh = new Webhook(env.CLERK_WEBHOOK_SECRET)
      let payload: any

      try {
        payload = wh.verify(request.rawBody, {
          'svix-id': svixId as string,
          'svix-timestamp': svixTimestamp as string,
          'svix-signature': svixSignature as string,
        })
      } catch {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Firma del webhook invalida',
            statusCode: 401,
          },
        })
      }

      const { type, data } = payload

      if (type === 'user.created') {
        const userId = data.id as string
        const email = (data.email_addresses?.[0]?.email_address as string) || ''
        const nombre =
          `${data.first_name || ''} ${data.last_name || ''}`.trim() || email

        const orgResponse = await fetch(
          'https://api.clerk.com/v1/organizations',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: `Tienda de ${nombre}`,
              created_by: userId,
            }),
          }
        )

        if (!orgResponse.ok) {
          fastify.log.error({ userId }, 'Error creando organización en Clerk')
          return reply.status(200).send(successResponse({ received: true }))
        }

        const org = (await orgResponse.json()) as { id: string }
        const orgId = org.id

        await prisma.tenant.upsert({
          where: { id: orgId },
          update: {},
          create: {
            id: orgId,
            nombreTienda: `Tienda de ${nombre}`,
          },
        })

        await prisma.usuario.upsert({
          where: { clerkUserId: userId },
          update: {},
          create: {
            clerkUserId: userId,
            tenantId: orgId,
            nombre,
            email,
            rol: 'OWNER',
          },
        })

        fastify.log.info(
          { userId, orgId },
          'Tenant y usuario creados via webhook'
        )
      }

      return reply.status(200).send(successResponse({ received: true }))
    }
  )
}
