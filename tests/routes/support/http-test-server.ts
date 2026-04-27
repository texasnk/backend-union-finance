import { Router } from 'express'
import { handleHttpError } from '../../../src/controllers/helpers/http'

export interface JsonRequestOptions {
    method: string
    path: string
    body?: unknown
}

export interface JsonResponse<T = unknown> {
    status: number
    body: T | string | null
}

interface MockResponse {
    statusCode: number
    body: unknown
    headers: Record<string, string>
    status: (code: number) => MockResponse
    json: (payload: unknown) => void
    setHeader: (name: string, value: string) => void
    getHeader: (name: string) => string | undefined
}

const createMockResponse = <T>(resolve: (value: JsonResponse<T>) => void): MockResponse => ({
    statusCode: 200,
    body: null,
    headers: {},
    status(code: number) {
        this.statusCode = code
        return this
    },
    json(payload: unknown) {
        this.body = payload
        resolve({
            status: this.statusCode,
            body: payload as T,
        })
    },
    setHeader(name: string, value: string) {
        this.headers[name.toLowerCase()] = value
    },
    getHeader(name: string) {
        return this.headers[name.toLowerCase()]
    },
})

export const requestJson = async <T = unknown>(
    router: Router,
    options: JsonRequestOptions,
): Promise<JsonResponse<T>> => {
    const targetUrl = new URL(options.path, 'http://localhost')
    const query = Object.fromEntries(targetUrl.searchParams.entries())

    return new Promise<JsonResponse<T>>((resolve, reject) => {
        const req = {
            method: options.method,
            url: `${targetUrl.pathname}${targetUrl.search}`,
            originalUrl: `${targetUrl.pathname}${targetUrl.search}`,
            path: targetUrl.pathname,
            body: options.body,
            query,
            params: {},
            headers: {},
        }

        const res = createMockResponse<T>(resolve)

        ; (router as any).handle(req, res, (error?: unknown) => {
            if (error) {
                handleHttpError(error, req as never, res as never, (() => undefined) as never)
                return
            }

            resolve({
                status: 404,
                body: null,
            })
        })
    })
}
