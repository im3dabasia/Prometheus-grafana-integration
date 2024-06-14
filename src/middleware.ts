import e, { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

// Basic middleware function to log request time
export const middleware = (req: Request, res: Response, next: NextFunction) => {
	const startTime = Date.now();
	next();
	const endTime = Date.now();
	console.log(`Request took ${endTime - startTime}ms`);
};

const requestCounter = new client.Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status_code', 'host'],
});

// create a guage
export const activeRequestsGauge = new client.Gauge({
	name: 'active_requests',
	help: 'Number of active requests',
	labelNames: ['method', 'route', 'host'],
});

export const activeRequestMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	activeRequestsGauge.inc({
		method: req.method,
		route: req.route ? req.route.path : req.path,
		host: req.host,
	});
	next();

	// Decrement active request gauge after 10 seconds can remove setTimeout
	setTimeout(() => {
		activeRequestsGauge.dec({
			method: req.method,
			route: req.route ? req.route.path : req.path,
			host: req.host,
		});
	}, 10000);
};

export const requestCountMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const startTime = Date.now();

	res.on('finish', () => {
		const endTime = Date.now();
		console.log(`Request took ${endTime - startTime}ms`);

		// Increment request counter
		requestCounter.inc({
			method: req.method,
			route: req.route ? req.route.path : req.path,
			status_code: res.statusCode,
			host: req.host,
		});
	});

	next();
};
