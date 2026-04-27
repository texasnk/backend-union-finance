const MONEY_FACTOR = 100

type NullableMoneyInput = string | number | null | undefined

/** Normalizes money values to a decimal string with up to two fraction digits. */
const normalizeMoneyInput = (value: NullableMoneyInput): string | null => {
    if (value == null) {
        return null
    }

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new Error('Invalid money value')
        }

        return value.toFixed(2)
    }

    const normalized = value.trim()

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
        throw new Error('Invalid money value')
    }

    return normalized
}

/** Converts a money value to integer cents to avoid floating-point drift. */
export const moneyToCents = (value: NullableMoneyInput): number => {
    const normalized = normalizeMoneyInput(value)

    if (normalized === null) {
        return 0
    }

    const [wholePart, decimalPart = ''] = normalized.split('.')
    const cents = `${decimalPart}00`.slice(0, 2)

    return Number(wholePart) * MONEY_FACTOR + Number(cents)
}

/** Formats integer cents back to a decimal string with two fraction digits. */
export const centsToMoney = (value: number | null | undefined): string => {
    if (value == null) {
        return ''
    }

    const sign = value < 0 ? '-' : ''
    const absoluteValue = Math.abs(value)
    const wholePart = Math.floor(absoluteValue / MONEY_FACTOR)
    const decimalPart = String(absoluteValue % MONEY_FACTOR).padStart(2, '0')

    return `${sign}${wholePart}.${decimalPart}`
}

/** Sums monetary values using integer cents arithmetic. */
export const sumMoney = (...values: NullableMoneyInput[]): string =>
    values.every((value) => value == null)
        ? ''
        : centsToMoney(values.reduce<number>((total, value) => total + moneyToCents(value), 0))

/** Subtracts one monetary value from another using integer cents arithmetic. */
export const subtractMoney = (left: NullableMoneyInput, right: NullableMoneyInput): string =>
    left == null || right == null ? '' : centsToMoney(moneyToCents(left) - moneyToCents(right))
