import express, { Application, Request, Response } from 'express';
import { handleHttpError } from './controllers/helpers/http';
import apiRouter from './routes';

export interface HealthResponse {
    status: 'ok';
    timestamp: number;
}

export const createApp = (): Application => {
    const app = express();

    app.use(express.json());

    app.get('/health', (_req: Request, res: Response<HealthResponse>) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    app.use(apiRouter);
    app.use(handleHttpError);

    return app;
};

export default createApp;
