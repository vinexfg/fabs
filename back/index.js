require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./src/middleware/auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', require('./src/routes/auth'));

app.use('/api', authMiddleware);
app.use('/api/patients',     require('./src/routes/patients'));
app.use('/api/treatments',   require('./src/routes/treatments'));
app.use('/api/payments',     require('./src/routes/payments'));
app.use('/api/evolutions',   require('./src/routes/evolutions'));
app.use('/api/appointments', require('./src/routes/appointments'));
app.use('/api/odontograma',  require('./src/routes/odontograma'));
app.use('/api/settings',     require('./src/routes/settings'));
app.use('/api/templates',    require('./src/routes/templates'));
app.use('/api/backup',       require('./src/routes/backup'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server rodando em http://localhost:${PORT}`));
