import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transformRoute from './transformRoute';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);

const allowedOrigins = new Set(['http://localhost:5173']);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(rateLimit());

app.use('/api/ai', transformRoute);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`AI proxy listening on http://localhost:${port}`);
});

function rateLimit() {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 30;

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || entry.resetAt < now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).send('Too many requests. Please slow down.');
    }

    entry.count += 1;
    hits.set(ip, entry);
    return next();
  };
}
