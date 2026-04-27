import { BusinessRuleViolationError } from '../errors/app-error'
import { addMonthsToPeriod, getDateDay, getPeriodFromDate } from './helpers/date'

export class CompetenceService {
    /** Derives the competence period directly from a reference date. */
    deriveFromReferenceDate(referenceDate: string | Date): string {
        return getPeriodFromDate(referenceDate)
    }

    /** Derives card competence based on transaction date and card closing day. */
    deriveFromCardTransactionDate(transactionDate: string | Date, closingDay: number): string {
        if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 28) {
            throw new BusinessRuleViolationError('closing_day must be between 1 and 28', {
                details: [{ field: 'closing_day', error: 'out_of_range' }],
            })
        }

        const basePeriod = getPeriodFromDate(transactionDate)
        const transactionDay = getDateDay(transactionDate)

        return transactionDay > closingDay ? addMonthsToPeriod(basePeriod, 1) : basePeriod
    }

    /** Advances a competence period by a number of months. */
    addMonths(period: string, monthsToAdd: number): string {
        return addMonthsToPeriod(period, monthsToAdd)
    }
}

export default CompetenceService
