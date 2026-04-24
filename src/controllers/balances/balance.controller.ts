import { Request, Response } from 'express'
import BalanceService from '../../services/balance.service'
import FinancialInsightService from '../../services/financial-insight.service'
import { parseInput } from '../helpers/http'
import {
    GetBalancesInsightsQuerySchema,
    GetBalancesInsightsResponseSchema,
    GetBalancesQuerySchema,
    GetBalancesResponseSchema,
} from './schemas'

export class BalanceController {
    constructor(
        private readonly balanceService: BalanceService = new BalanceService(),
        private readonly financialInsightService: FinancialInsightService = new FinancialInsightService(),
    ) { }

    /** Returns the monthly balance for the provided competence month. */
    async getMonthlyBalance(req: Request, res: Response): Promise<void> {
        const query = parseInput(GetBalancesQuerySchema, req.query)
        const balance = await this.balanceService.calculateMonthlyBalance(query.month)

        res.status(200).json(GetBalancesResponseSchema.parse(balance))
    }

    /** Returns AI-assisted financial insights for the provided competence month. */
    async getMonthlyInsight(req: Request, res: Response): Promise<void> {
        const query = parseInput(GetBalancesInsightsQuerySchema, req.query)
        const insight = await this.financialInsightService.generateMonthlyInsight(query.month)

        res.status(200).json(GetBalancesInsightsResponseSchema.parse({
            month: insight.month,
            summary_text: insight.summary_text,
            highlights: insight.highlights.map((item) => ({
                category: item.category,
                total: Number(item.total),
            })),
            alerts: insight.alerts,
        }))
    }
}

export default BalanceController
