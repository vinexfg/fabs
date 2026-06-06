require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeSchema } = require('./src/infrastructure/database/schema');
const { authenticate } = require('./src/interfaces/middleware/AuthMiddleware');

initializeSchema();

const app = express();
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

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server rodando em http://localhost:${PORT}`));
