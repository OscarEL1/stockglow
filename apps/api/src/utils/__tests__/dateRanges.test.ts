import { describe, it, expect } from 'vitest'
import { calcPercentageChange, getSalesPeriodRanges } from '../dateRanges.js'

describe('getSalesPeriodRanges — America/Mexico_City', () => {
  // Miercoles 2026-07-22 a las 23:50 hora Mexico (MX es UTC-6 todo el
  // ano, sin horario de verano desde 2022) = 2026-07-23T05:50:00.000Z.
  // Una lectura ingenua por dia calendario UTC (toISOString().split('T')[0])
  // clasificaria esto como 2026-07-23 — un dia despues del real.
  const lateNightMexico = new Date('2026-07-23T05:50:00.000Z')

  it('a las 23:50 hora Mexico, la venta sigue contando como "hoy" y no se corre al dia UTC siguiente', () => {
    const { hoy } = getSalesPeriodRanges(lateNightMexico)

    expect(lateNightMexico >= hoy.start && lateNightMexico <= hoy.end).toBe(
      true
    )

    const naiveUtcDay = lateNightMexico.toISOString().split('T')[0]
    expect(naiveUtcDay).toBe('2026-07-23') // confirma que el bug naive existiria
    expect(hoy.start.toISOString()).not.toContain(naiveUtcDay)
  })

  it('calcula el rango de "hoy" como 00:00:00.000 a 23:59:59.999 hora Mexico, en UTC', () => {
    const { hoy } = getSalesPeriodRanges(lateNightMexico)

    expect(hoy.start.toISOString()).toBe('2026-07-22T06:00:00.000Z')
    expect(hoy.end.toISOString()).toBe('2026-07-23T05:59:59.999Z')
  })

  it('una venta justo despues del corte de "hoy" (00:00:00 MX del dia siguiente) queda excluida', () => {
    const { hoy } = getSalesPeriodRanges(lateNightMexico)
    const nextDayMidnightMexico = new Date('2026-07-23T06:00:00.000Z')

    expect(nextDayMidnightMexico > hoy.end).toBe(true)
  })

  it('calcula la semana ISO (lunes a domingo) para un miercoles de referencia', () => {
    // 2026-07-22 es miercoles → semana ISO: lunes 2026-07-20 a domingo 2026-07-26
    const { semana } = getSalesPeriodRanges(lateNightMexico)

    expect(semana.start.toISOString()).toBe('2026-07-20T06:00:00.000Z')
    expect(semana.end.toISOString()).toBe('2026-07-27T05:59:59.999Z')
  })

  it('calcula el mes calendario completo (dia 1 al ultimo dia del mes)', () => {
    // Julio 2026 tiene 31 dias
    const { mes } = getSalesPeriodRanges(lateNightMexico)

    expect(mes.start.toISOString()).toBe('2026-07-01T06:00:00.000Z')
    expect(mes.end.toISOString()).toBe('2026-08-01T05:59:59.999Z')
  })

  it('calcula el mes calendario anterior completo (junio 2026, 30 dias)', () => {
    const { mesAnterior } = getSalesPeriodRanges(lateNightMexico)

    expect(mesAnterior.start.toISOString()).toBe('2026-06-01T06:00:00.000Z')
    expect(mesAnterior.end.toISOString()).toBe('2026-07-01T05:59:59.999Z')
  })

  it('produce los mismos rangos sin importar el TZ del proceso Node', () => {
    const original = process.env.TZ
    try {
      process.env.TZ = 'UTC'
      const inUtc = getSalesPeriodRanges(lateNightMexico)

      process.env.TZ = 'Asia/Tokyo'
      const inTokyo = getSalesPeriodRanges(lateNightMexico)

      expect(inUtc.hoy.start.toISOString()).toBe(
        inTokyo.hoy.start.toISOString()
      )
      expect(inUtc.semana.end.toISOString()).toBe(
        inTokyo.semana.end.toISOString()
      )
      expect(inUtc.mes.start.toISOString()).toBe(
        inTokyo.mes.start.toISOString()
      )
    } finally {
      process.env.TZ = original
    }
  })
})

describe('calcPercentageChange', () => {
  it('calcula el porcentaje de cambio cuando el mes actual vendio mas que el anterior', () => {
    expect(calcPercentageChange(1500, 1000)).toBe(50)
  })

  it('calcula el porcentaje de cambio (negativo) cuando el mes actual vendio menos', () => {
    expect(calcPercentageChange(800, 1000)).toBe(-20)
  })

  it('retorna 0 sin lanzar error cuando el mes anterior no tuvo ventas (evita division por cero)', () => {
    expect(calcPercentageChange(1500, 0)).toBe(0)
    expect(Number.isFinite(calcPercentageChange(1500, 0))).toBe(true)
  })

  it('retorna 0 cuando ni el mes actual ni el anterior tuvieron ventas', () => {
    expect(calcPercentageChange(0, 0)).toBe(0)
  })
})
