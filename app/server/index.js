require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', require('./routes/auth'));

app.use('/api', authMiddleware);
app.use('/api/patients',     require('./routes/patients'));
app.use('/api/treatments',   require('./routes/treatments'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/evolutions',   require('./routes/evolutions'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/odontograma',  require('./routes/odontograma'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/templates',    require('./routes/templates'));
app.use('/api/backup',       require('./routes/backup'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server rodando em http://localhost:${PORT}`));
