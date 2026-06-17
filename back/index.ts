import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import { initializeSchema } from './src/infrastructure/database/schema';
import { authenticate } from './src/interfaces/middleware/AuthMiddleware';

initializeSchema();

const app = express();

if (process.env.NODE_ENV === 'production') {
  // Railway roda atrás de um proxy reverso; necessário para o express-rate-limit
  // interpretar corretamente o header X-Forwarded-For.
  app.set('trust proxy', 1);
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // O React usa props style={{...}} (atributos inline) em várias telas/impressões.
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      // Fotos de pacientes são salvas como base64 e exibidas via <img src="data:...">.
      imgSrc: ["'self'", 'data:'],
    },
  },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', require('./src/interfaces/routes/auth').default);

app.use('/api', authenticate);
app.use('/api/patients',     require('./src/interfaces/routes/patients').default);
app.use('/api/treatments',   require('./src/interfaces/routes/treatments').default);
app.use('/api/payments',     require('./src/interfaces/routes/payments').default);
app.use('/api/evolutions',   require('./src/interfaces/routes/evolutions').default);
app.use('/api/appointments', require('./src/interfaces/routes/appointments').default);
app.use('/api/odontograma',  require('./src/interfaces/routes/odontograma').default);
app.use('/api/settings',     require('./src/interfaces/routes/settings').default);
app.use('/api/templates',    require('./src/interfaces/routes/templates').default);
app.use('/api/backup',       require('./src/interfaces/routes/backup').default);
app.use('/api/budgets',      require('./src/interfaces/routes/budgets').default);
app.use('/api/search',      require('./src/interfaces/routes/search').default);
app.use('/api/reports',     require('./src/interfaces/routes/reports').default);

app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : (err.message || 'Erro interno do servidor');
  res.status(500).json({ error: message });
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'front', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
