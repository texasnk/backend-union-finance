import { TransactionType } from '@prisma/client'

export interface SuggestCategoryInputDto {
    name: string
    amount: string
    type: TransactionType
    card_id?: string | null
}

export interface CategorySuggestionDto {
    category: string
    confidence: number
}

export interface MonthlyCategoryHighlightDto {
    category: string
    total: string
}

export interface MonthlyInsightAlertDto {
    type: string
    description: string
}

export interface MonthlyFinancialSummaryInputDto {
    month: string
    incomes: string
    expenses: string
    balance: string
    highlights: MonthlyCategoryHighlightDto[]
    alerts: MonthlyInsightAlertDto[]
}

export interface MonthlyFinancialInsightDto {
    month: string
    summary_text: string
    highlights: MonthlyCategoryHighlightDto[]
    alerts: MonthlyInsightAlertDto[]
}
