const express = require('express');
const {
  listJadwalDokter,
  getJadwalDokter,
  createJadwalDokter,
  updateJadwalDokter,
  deleteJadwalDokter,
} = require('./controller');

const route = express.Router();

route.get('', listJadwalDokter);
route.get('/:id', getJadwalDokter);
route.post('', createJadwalDokter);
route.put('/:id', updateJadwalDokter);
route.patch('/:id', updateJadwalDokter);
route.delete('/:id', deleteJadwalDokter);

module.exports = route;