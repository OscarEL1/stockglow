import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

export const SALES_METRICS_TIMEZONE = 'America/Mexico_City'

export interface DateRange {
  start: Date
  end: Date
}

export interface SalesPeriodRanges {
  hoy: DateRange
  semana: DateRange
  mes: DateRange
  mesAnterior: DateRange
}

/*
 * date-fns opera sobre los getters/setters locales del runtime, por lo
 * que aplicarlo directo sobre `now` daria limites de dia/semana/mes en
 * la zona horaria del servidor (UTC en produccion). Convertimos primero
 * a la "hora de pared" de Mexico City con toZonedTime, calculamos el
 * limite con date-fns normal, y regresamos a un instante UTC real con
 * fromZonedTime. Esto es correcto sin importar el TZ del proceso Node.
 */
function rangeInTimeZone(
  reference: Date,
  timeZone: string,
  startOf: (date: Date) => Date,
  endOf: (date: Date) => Date
): DateRange {
  const zonedReference = toZonedTime(reference, timeZone)
  return {
    start: fromZonedTime(startOf(zonedReference), timeZone),
    end: fromZonedTime(endOf(zonedReference), timeZone),
  }
}

export function getSalesPeriodRanges(
  now: Date = new Date(),
  timeZone: string = SALES_METRICS_TIMEZONE
): SalesPeriodRanges {
  return {
    hoy: rangeInTimeZone(now, timeZone, startOfDay, endOfDay),
    semana: rangeInTimeZone(
      now,
      timeZone,
      (date) => startOfWeek(date, { weekStartsOn: 1 }),
      (date) => endOfWeek(date, { weekStartsOn: 1 })
    ),
    mes: rangeInTimeZone(now, timeZone, startOfMonth, endOfMonth),
    mesAnterior: rangeInTimeZone(
      now,
      timeZone,
      (date) => startOfMonth(subMonths(date, 1)),
      (date) => endOfMonth(subMonths(date, 1))
    ),
  }
}

/*
 * Evita division por cero cuando no hay ventas registradas el mes
 * anterior (tenant nuevo, o simplemente sin ventas ese mes) — en ese
 * caso no hay "cambio" que reportar, se devuelve 0 y el frontend usa
 * el propio montoMesAnterior === 0 para distinguir "0% sin cambio" de
 * "sin datos para comparar".
 */
export function calcPercentageChange(actual: number, anterior: number): number {
  if (anterior === 0) return 0
  return ((actual - anterior) / anterior) * 100
}
