import { ValidationError } from '../../errors/app-error'

const ISO_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

interface LocalDateParts {
    year: number
    month: number
    day: number
}

const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
})

/** Extracts Sao Paulo local date parts from a Date instance. */
const parseDateFromDateObject = (value: Date): LocalDateParts => {
    if (Number.isNaN(value.getTime())) {
        throw new ValidationError('Invalid date value')
    }

    const parts = formatter.formatToParts(value)
    const year = Number(parts.find((part) => part.type === 'year')?.value)
    const month = Number(parts.find((part) => part.type === 'month')?.value)
    const day = Number(parts.find((part) => part.type === 'day')?.value)

    return { year, month, day }
}

/** Parses and validates an ISO date string in YYYY-MM-DD format. */
const parseDateFromString = (value: string): LocalDateParts => {
    if (!ISO_DATE_PATTERN.test(value)) {
        throw new ValidationError('Invalid date format. Expected YYYY-MM-DD', {
            details: [{ field: 'date', error: 'invalid_format' }],
        })
    }

    const [yearText, monthText, dayText] = value.split('-')
    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)

    const utcDate = new Date(Date.UTC(year, month - 1, day))

    if (
        utcDate.getUTCFullYear() !== year ||
        utcDate.getUTCMonth() !== month - 1 ||
        utcDate.getUTCDate() !== day
    ) {
        throw new ValidationError('Invalid calendar date', {
            details: [{ field: 'date', error: 'invalid_value' }],
        })
    }

    return { year, month, day }
}

/** Parses either a string or Date into Sao Paulo local date parts. */
export const parseLocalDate = (value: string | Date): LocalDateParts =>
    typeof value === 'string' ? parseDateFromString(value) : parseDateFromDateObject(value)

/** Validates that a value matches the persisted YYYY-MM period format. */
export const assertPeriod = (value: string): string => {
    if (!PERIOD_PATTERN.test(value)) {
        throw new ValidationError('Invalid period format. Expected YYYY-MM', {
            details: [{ field: 'month', error: 'invalid_format' }],
        })
    }

    return value
}

/** Formats a year and month into the canonical YYYY-MM period key. */
export const formatPeriod = (year: number, month: number): string => `${year}-${String(month).padStart(2, '0')}`

/** Adds a number of months to a YYYY-MM period string. */
export const addMonthsToPeriod = (period: string, monthsToAdd: number): string => {
    assertPeriod(period)

    const [yearText, monthText] = period.split('-')
    const baseYear = Number(yearText)
    const baseMonth = Number(monthText)
    const totalMonths = baseYear * 12 + (baseMonth - 1) + monthsToAdd
    const year = Math.floor(totalMonths / 12)
    const month = (totalMonths % 12) + 1

    return formatPeriod(year, month)
}

/** Returns the day-of-month in America/Sao_Paulo for a date value. */
export const getDateDay = (value: string | Date): number => parseLocalDate(value).day

/** Derives the YYYY-MM competence period from a date value. */
export const getPeriodFromDate = (value: string | Date): string => {
    const { year, month } = parseLocalDate(value)
    return formatPeriod(year, month)
}
