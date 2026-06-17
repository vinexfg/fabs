require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initializeSchema } = require('./src/infrastructure/database/schema');
const { authenticate } = require('./src/interfaces/middleware/AuthMiddleware');

initializeSchema();

const app = express();

if (process.env.NODE_ENV === 'production') {
  // Railway roda atrás de um proxy reverso; necessário para o express-rate-limit
  // interpretar corretamente o header X-Forwarded-For.
  app.set('trust proxy', 1);
}

// CSP desativado: o front usa script inline (anti-FOUC do dark mode) e fontes do
// Google Fonts que exigiriam uma política customizada para não quebrar a SPA.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', require('./src/interfaces/routes/auth'));

app.use('/api', authenticate);
app.use('/api/patients',     require('./src/interfaces/routes/patients'));
app.use('/api/treatments',   require('./src/interfaces/routes/treatments'));
app.use('/api/payments',     require('./src/interfaces/routes/payments'));
app.use('/api/evolutions',   require('./src/interfaces/routes/evolutions'));
app.use('/api/appointments', require('./src/interfaces/routes/appointments'));
app.use('/api/odontograma',  require('./src/interfaces/routes/odontograma'));
app.use('/api/settings',     require('./src/interfaces/routes/settings'));
app.use('/api/templates',    require('./src/interfaces/routes/templates'));
app.use('/api/backup',       require('./src/interfaces/routes/backup'));
app.use('/api/budgets',      require('./src/interfaces/routes/budgets'));
app.use('/api/search',      require('./src/interfaces/routes/search'));
app.use('/api/reports',     require('./src/interfaces/routes/reports'));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : (err.message || 'Erro interno do servidor');
  res.status(500).json({ error: message });
});

if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const distPath = path.join(__dirname, '..', 'front', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
