/**
 * Tiny wrapper around prom-client. Each service calls registerMetrics(app, serviceName)
 * which adds a /metrics endpoint and an onResponse hook that records request
 * latency + count, labelled by route + status + service.
 *
 * No third-party agent needed — Prometheus scrapes /metrics on each service.
 */
const client = require('prom-client');

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['service', 'method', 'route', 'status'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['service', 'method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const tenantContextSets = new client.Counter({
  name: 'tenant_context_sets_total',
  help: 'Number of times withTenant() set RLS context',
  labelNames: ['service'],
});

// Default Node.js metrics (heap, event-loop lag, gc, etc.)
client.collectDefaultMetrics({ prefix: 'hs_' });

function registerMetrics(app, serviceName) {
  app.addHook('onResponse', async (req, reply) => {
    const route = req.routeOptions?.url || req.url.split('?')[0] || 'unknown';
    const labels = {
      service: serviceName,
      method: req.method,
      route,
      status: String(reply.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, reply.elapsedTime / 1000);
  });

  app.get('/metrics', async (req, reply) => {
    reply.header('Content-Type', client.register.contentType);
    return client.register.metrics();
  });
}

module.exports = {
  client,
  registerMetrics,
  tenantContextSets,
};
