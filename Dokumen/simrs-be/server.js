const express = require('express');
const cors = require('cors');
require('dotenv').config();
const registrastionRouter = require('./routes/registration/router');
const pemeriksaanRouter = require('./routes/pemeriksaan/router');
const farmasiRouter = require('./routes/farmasi/router');
const detailFarmasiRouter = require('./routes/detail_farmasi/router');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/registration', registrastionRouter)
app.use('/api/v1/pemeriksaan', pemeriksaanRouter)
app.use('/api/v1/farmasi', farmasiRouter)
app.use('/api/v1/detail_farmasi', detailFarmasiRouter)

// Menjalankan server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});