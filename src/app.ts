import express, { Application, Request, Response } from 'express';

export interface HealthResponse {
    status: 'ok';
    timestamp: number;
}

export const createApp = (): Application => {
    const app = express();

    app.get('/health', (_req: Request, res: Response<HealthResponse>) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    return app;
};

export default createApp;
