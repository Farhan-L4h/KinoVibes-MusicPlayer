import fs from 'node:fs';
import path from 'node:path';

// Serves /api/* handlers from the api/ dir during `vite dev`,
// mirroring Vercel's serverless routing so dev and prod behave the same.
export default function apiDevPlugin() {
  return {
    name: 'kv-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!url.pathname.startsWith('/api/')) return next();
        const name = url.pathname.slice(5).replace(/\/+$/, '');
        if (!/^[\w-]+$/.test(name) || name.startsWith('_')) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
        }
        const file = path.resolve(process.cwd(), 'api', `${name}.js`);
        if (!fs.existsSync(file)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API not found' }));
          return;
        }
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          req.query = Object.fromEntries(url.searchParams.entries());
          await mod.default(req, res);
          if (!res.writableEnded) res.end();
        } catch (err) {
          server.ssrFixStacktrace?.(err);
          console.error('[api-dev]', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal error' }));
          } else if (!res.writableEnded) {
            res.end();
          }
        }
      });
    },
  };
}