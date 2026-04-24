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
