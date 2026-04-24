import {
    MonthlyFinancialInsightDto,
    MonthlyFinancialSummaryInputDto,
    MonthlyInsightAlertDto,
} from '../dtos/ai.dto'
import OccurrenceRepository from '../repositories/occurrence.repository'
import { FinancialAIProvider } from './ai/ai-provider'
import { createFinancialAIProvider } from './ai/financial-ai.factory'
import BalanceService from './balance.service'
import { assertPeriod } from './helpers/date'
import { moneyToCents, subtractMoney } from './helpers/money'

export class FinancialInsightService {
    private readonly balanceService: BalanceService

    constructor(
        private readonly occurrenceRepository: OccurrenceRepository = new OccurrenceRepository(),
        private readonly aiProvider: FinancialAIProvider = createFinancialAIProvider(),
    ) {
        this.balanceService = new BalanceService(this.occurrenceRepository)
    }

    /** Generates the monthly financial insight response from local aggregates plus AI summary text. */
    async generateMonthlyInsight(month: string): Promise<MonthlyFinancialInsightDto> {
        const normalizedMonth = assertPeriod(month)
        const [balance, highlights, uncategorizedCount] = await Promise.all([
            this.balanceService.calculateMonthlyBalance(normalizedMonth),
            this.occurrenceRepository.getTopCategoryHighlights(normalizedMonth),
            this.occurrenceRepository.countUncategorizedByMonth(normalizedMonth),
        ])

        const alerts = this.buildAlerts(balance.incomes, balance.expenses, uncategorizedCount, normalizedMonth)
        const summaryInput: MonthlyFinancialSummaryInputDto = {
            month: normalizedMonth,
            incomes: balance.incomes.toFixed(2),
            expenses: balance.expenses.toFixed(2),
            balance: balance.balance.toFixed(2),
            highlights,
            alerts,
        }
        const summaryText = await this.aiProvider.generateMonthlySummary(summaryInput)

        return {
            month: normalizedMonth,
            summary_text: summaryText,
            highlights,
            alerts,
        }
    }

    /** Builds deterministic alerts from the aggregated monthly financial state. */
    private buildAlerts(
        incomes: number,
        expenses: number,
        uncategorizedCount: number,
        month: string,
    ): MonthlyInsightAlertDto[] {
        const alerts: MonthlyInsightAlertDto[] = []

        if (moneyToCents(expenses) > moneyToCents(incomes)) {
            alerts.push({
                type: 'negative_balance',
                description: `As saídas superaram as entradas em ${subtractMoney(
                    expenses.toFixed(2),
                    incomes.toFixed(2),
                )} no mês ${month}.`,
            })
        }

        if (uncategorizedCount > 0) {
            alerts.push({
                type: 'uncategorized_occurrences',
                description: `${uncategorizedCount} ocorrências de ${month} estão sem categoria.`,
            })
        }

        return alerts
    }
}

export default FinancialInsightService
