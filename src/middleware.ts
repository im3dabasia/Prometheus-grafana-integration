import { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

// Basic middleware function to log request time
export const middleware = (req: Request, res: Response, next: NextFunction) => {
	const startTime = Date.now();
	next();
	const endTime = Date.now();
	console.log(`Request took ${endTime - startTime}ms`);
};

//  A counter and a middleware function to increment the counter
const requestCounter = new client.Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status_code', 'host'],
});

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

//  a guage and a middleware function to increment the gauge
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

export const requestTimeHistogram = new client.Histogram({
	name: 'request_time_seconds',
	help: 'Request time in seconds',
	labelNames: ['method', 'route', 'host'],
	buckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10],
});

export const requestTimeMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const startTime = Date.now();
	// activeRequestsGauge.inc();

	res.on('finish', () => {
		const endTime = Date.now();
		const duration = endTime - startTime;

		console.log(`Request took ${endTime - startTime}ms`);

		requestTimeHistogram.observe(
			{
				method: req.method,
				route: req.route ? req.route.path : req.path,
				host: req.host,
			},
			duration
		);
		// activeRequestsGauge.dec();
	});

	next();
};
