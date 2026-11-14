const express = require('express');
const {
  listDokter,
  getDokter,
  createDokter,
  updateDokter,
  deleteDokter,
} = require('./controller');

const route = express.Router();

route.get('', listDokter);
route.get('/:id', getDokter);
route.post('', createDokter);
route.put('/:id', updateDokter);
route.patch('/:id', updateDokter);
route.delete('/:id', deleteDokter);

module.exports = route;