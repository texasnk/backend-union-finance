import { FinancialAIProvider } from './ai-provider'
import OpenAIFinancialAIProvider from './openai-financial-ai.provider'
import ResilientFinancialAIProvider from './resilient-financial-ai.provider'
import { MemoryCache } from './memory-cache'
import { LocalHeuristicFinancialAIProvider } from './stub-financial-ai.provider'

const DEFAULT_CACHE_TTL_MINUTES = 15
const DEFAULT_OPENAI_TIMEOUT_MS = 4000
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'

/** Resolves the AI cache TTL from environment variables with a safe fallback. */
const getCacheTtlMs = (): number => {
    const rawValue = process.env.AI_CACHE_TTL_MINUTES
    const ttlMinutes = rawValue ? Number(rawValue) : DEFAULT_CACHE_TTL_MINUTES

    if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
        return DEFAULT_CACHE_TTL_MINUTES * 60 * 1000
    }

    return ttlMinutes * 60 * 1000
}

/** Resolves the OpenAI timeout with a bounded default for non-critical AI flows. */
const getOpenAITimeoutMs = (): number => {
    const rawValue = process.env.OPENAI_TIMEOUT_MS
    const timeoutMs = rawValue ? Number(rawValue) : DEFAULT_OPENAI_TIMEOUT_MS

    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        return DEFAULT_OPENAI_TIMEOUT_MS
    }

    return timeoutMs
}

/** Builds the financial AI provider used by category suggestion and insights services. */
export const createFinancialAIProvider = (): FinancialAIProvider => {
    const ttlMs = getCacheTtlMs()
    const fallbackProvider = new LocalHeuristicFinancialAIProvider(
        new MemoryCache(ttlMs),
        new MemoryCache(ttlMs),
    )
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        return fallbackProvider
    }

    const primaryProvider = new OpenAIFinancialAIProvider({
        apiKey,
        model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
        timeoutMs: getOpenAITimeoutMs(),
        baseUrl: process.env.OPENAI_BASE_URL,
    })

    return new ResilientFinancialAIProvider(fallbackProvider, primaryProvider)
}
