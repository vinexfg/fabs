import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import { initializeSchema } from './src/infrastructure/database/schema';
import { authenticate } from './src/interfaces/middleware/AuthMiddleware';
import authRoutes from './src/interfaces/routes/auth';
import patientsRoutes from './src/interfaces/routes/patients';
import treatmentsRoutes from './src/interfaces/routes/treatments';
import paymentsRoutes from './src/interfaces/routes/payments';
import evolutionsRoutes from './src/interfaces/routes/evolutions';
import appointmentsRoutes from './src/interfaces/routes/appointments';
import odontogramaRoutes from './src/interfaces/routes/odontograma';
import settingsRoutes from './src/interfaces/routes/settings';
import templatesRoutes from './src/interfaces/routes/templates';
import backupRoutes from './src/interfaces/routes/backup';
import budgetsRoutes from './src/interfaces/routes/budgets';
import searchRoutes from './src/interfaces/routes/search';
import reportsRoutes from './src/interfaces/routes/reports';

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

app.use('/api/auth', authRoutes);

app.use('/api', authenticate);
app.use('/api/patients',     patientsRoutes);
app.use('/api/treatments',   treatmentsRoutes);
app.use('/api/payments',     paymentsRoutes);
app.use('/api/evolutions',   evolutionsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/odontograma',  odontogramaRoutes);
app.use('/api/settings',     settingsRoutes);
app.use('/api/templates',    templatesRoutes);
app.use('/api/backup',       backupRoutes);
app.use('/api/budgets',      budgetsRoutes);
app.use('/api/search',       searchRoutes);
app.use('/api/reports',      reportsRoutes);

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
