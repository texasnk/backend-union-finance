import { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodError } from 'zod'
import { AppError, ValidationError } from '../../errors/app-error'

export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

/** Wraps async controllers so route handlers forward failures to the error middleware. */
export const asyncHandler = (handler: AsyncRequestHandler): RequestHandler =>
    (req, res, next) => void handler(req, res, next).catch(next)

/** Parses unknown payloads with zod and rewrites schema failures to application validation errors. */
export const parseInput = <T>(schema: { parse: (input: unknown) => T }, input: unknown): T => {
    try {
        return schema.parse(input)
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ValidationError('Invalid request input', {
                details: error.issues.map((issue) => ({
                    field: issue.path.join('.') || 'request',
                    error: issue.message,
                })),
            })
        }

        throw error
    }
}

/** Translates domain and unexpected errors into the API error response format. */
export const handleHttpError = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (error instanceof AppError) {
        const status =
            error.code === 'VALIDATION_ERROR' ? 400 :
                error.code === 'NOT_FOUND' ? 404 :
                    500

        res.status(status).json({
            code: error.code,
            message: error.message,
            details: error.details,
        })

        return
    }

    res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Unexpected internal error',
    })
}
