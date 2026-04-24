export interface AppErrorOptions {
    cause?: unknown
    details?: unknown
}

export class AppError extends Error {
    public readonly code: string
    public readonly details?: unknown
    public readonly cause?: unknown

    constructor(code: string, message: string, options?: AppErrorOptions) {
        super(message)
        this.name = 'AppError'
        this.code = code
        this.details = options?.details
        this.cause = options?.cause
    }
}

export class RepositoryError extends AppError {
    constructor(message: string, options?: AppErrorOptions) {
        super('REPOSITORY_ERROR', message, options)
        this.name = 'RepositoryError'
    }
}

export class ValidationError extends AppError {
    constructor(message: string, options?: AppErrorOptions) {
        super('VALIDATION_ERROR', message, options)
        this.name = 'ValidationError'
    }
}

export class NotFoundError extends AppError {
    constructor(message: string, options?: AppErrorOptions) {
        super('NOT_FOUND', message, options)
        this.name = 'NotFoundError'
    }
}

export class BusinessRuleViolationError extends AppError {
    constructor(message: string, options?: AppErrorOptions) {
        super('BUSINESS_RULE_VIOLATION', message, options)
        this.name = 'BusinessRuleViolationError'
    }
}

export class InfrastructureError extends AppError {
    constructor(message: string, options?: AppErrorOptions) {
        super('INTERNAL_ERROR', message, options)
        this.name = 'InfrastructureError'
    }
}
