import { z } from 'zod'
import {
    CategorySuggestionDto,
    MonthlyFinancialSummaryInputDto,
    SuggestCategoryInputDto,
} from '../../dtos/ai.dto'
import { FinancialAIProvider } from './ai-provider'

const categorySuggestionSchema = z.object({
    suggestions: z.array(z.object({
        category: z.string().trim().min(1).max(60),
        confidence: z.number().min(0).max(1),
    }).strict()).max(3),
}).strict()

const monthlySummarySchema = z.object({
    summary_text: z.string().trim().min(1).max(600),
}).strict()

interface OpenAIChatCompletionResponse {
    choices?: Array<{
        message?: {
            content?: string | null
        }
    }>
}

export interface OpenAIFinancialAIProviderOptions {
    apiKey: string
    model: string
    timeoutMs: number
    baseUrl?: string
}

export class OpenAIFinancialAIProvider implements FinancialAIProvider {
    private readonly baseUrl: string

    constructor(private readonly options: OpenAIFinancialAIProviderOptions) {
        this.baseUrl = (options.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '')
    }

    /** Requests category suggestions from OpenAI using structured JSON output. */
    async suggestCategory(input: SuggestCategoryInputDto): Promise<CategorySuggestionDto[]> {
        const payload = await this.requestStructuredOutput(
            [
                {
                    role: 'system',
                    content:
                        'Você classifica transações financeiras pessoais em categorias curtas em português do Brasil. ' +
                        'Retorne somente JSON válido no schema solicitado.',
                },
                {
                    role: 'user',
                    content:
                        `Sugira até 3 categorias para a transação.\n` +
                        `nome: ${input.name}\n` +
                        `valor: ${input.amount}\n` +
                        `tipo: ${input.type}\n` +
                        `cartao_id: ${input.card_id ?? 'sem_cartao'}`,
                },
            ],
            {
                name: 'category_suggestions',
                schema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        suggestions: {
                            type: 'array',
                            maxItems: 3,
                            items: {
                                type: 'object',
                                additionalProperties: false,
                                properties: {
                                    category: { type: 'string' },
                                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                                },
                                required: ['category', 'confidence'],
                            },
                        },
                    },
                    required: ['suggestions'],
                },
            },
            categorySuggestionSchema,
        )

        return payload.suggestions
    }

    /** Requests a monthly financial summary from OpenAI using structured JSON output. */
    async generateMonthlySummary(input: MonthlyFinancialSummaryInputDto): Promise<string> {
        const highlightsText = input.highlights.length > 0
            ? input.highlights.map((item) => `${item.category}: ${item.total}`).join('; ')
            : 'sem destaques'
        const alertsText = input.alerts.length > 0
            ? input.alerts.map((item) => `${item.type}: ${item.description}`).join('; ')
            : 'sem alertas'

        const payload = await this.requestStructuredOutput(
            [
                {
                    role: 'system',
                    content:
                        'Você resume dados financeiros mensais em português do Brasil. ' +
                        'Use apenas os números fornecidos e não invente valores. ' +
                        'Retorne somente JSON válido no schema solicitado.',
                },
                {
                    role: 'user',
                    content:
                        `Gere um resumo financeiro curto para ${input.month}.\n` +
                        `entradas: ${input.incomes}\n` +
                        `saidas: ${input.expenses}\n` +
                        `saldo: ${input.balance}\n` +
                        `destaques: ${highlightsText}\n` +
                        `alertas: ${alertsText}`,
                },
            ],
            {
                name: 'monthly_financial_summary',
                schema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        summary_text: { type: 'string' },
                    },
                    required: ['summary_text'],
                },
            },
            monthlySummarySchema,
        )

        return payload.summary_text
    }

    /** Executes a structured chat completion request with timeout and schema validation. */
    private async requestStructuredOutput<T>(
        messages: Array<{ role: 'system' | 'user'; content: string }>,
        schemaDefinition: { name: string; schema: Record<string, unknown> },
        responseSchema: z.ZodType<T>,
    ): Promise<T> {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs)

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.options.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.options.model,
                    temperature: 0,
                    messages,
                    response_format: {
                        type: 'json_schema',
                        json_schema: {
                            name: schemaDefinition.name,
                            strict: true,
                            schema: schemaDefinition.schema,
                        },
                    },
                }),
                signal: controller.signal,
            })

            if (!response.ok) {
                throw new Error(`OpenAI request failed with status ${response.status}`)
            }

            const payload = (await response.json()) as OpenAIChatCompletionResponse
            const content = payload.choices?.[0]?.message?.content

            if (typeof content !== 'string' || !content.trim()) {
                throw new Error('OpenAI returned an empty response')
            }

            const parsedJson = JSON.parse(content) as unknown
            return responseSchema.parse(parsedJson)
        } finally {
            clearTimeout(timeoutId)
        }
    }
}

export default OpenAIFinancialAIProvider
