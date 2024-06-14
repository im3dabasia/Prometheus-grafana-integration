import express, { Request, Response } from 'express';
import client from 'prom-client';

import {
	middleware,
	requestCountMiddleware,
	activeRequestMiddleware,
} from './middleware';

const app = express();

app.use(express.json());
// app.use(middleware);
app.use(requestCountMiddleware);
app.use(activeRequestMiddleware);

app.get('/', (req: Request, res: Response) => {
	res.send('Hello World');
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
	const metrics = await client.register.metrics();
	res.set('Content-Type', client.register.contentType);
	res.end(metrics);
});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
