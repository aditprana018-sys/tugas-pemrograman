const express = require('express');
const cors = require('cors');
require('dotenv').config();
const registrastionRouter = require('./routes/registration/router');
const pemeriksaanRouter = require('./routes/pemeriksaan/router');
const farmasiRouter = require('./routes/farmasi/router');
const detailFarmasiRouter = require('./routes/detail_farmasi/router');
const dokterRouter = require('./routes/dokter/router');
const jadwalDokterRouter = require('./routes/jadwal_dokter/router');
const poliRouter = require('./routes/poli/router');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/registration', registrastionRouter)
app.use('/api/v1/pemeriksaan', pemeriksaanRouter)
app.use('/api/v1/farmasi', farmasiRouter)
app.use('/api/v1/detail_farmasi', detailFarmasiRouter)
app.use('/api/v1/dokter', dokterRouter);
app.use('/api/v1/jadwal_dokter', jadwalDokterRouter);
app.use('/api/v1/poli', poliRouter);

// Menjalankan server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});