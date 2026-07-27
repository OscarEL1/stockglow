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

export function calcPercentageChange(actual: number, anterior: number): number {
  if (anterior === 0) return 0
  return ((actual - anterior) / anterior) * 100
}
