const express = require('express');
const {
  listFarmasi,
  getFarmasi,
  createFarmasi,
  updateFarmasi,
  deleteFarmasi,
} = require('./controller');

const route = express.Router();

route.get('', listFarmasi);
route.get('/:id', getFarmasi);
route.post('', createFarmasi);
route.put('/:id', updateFarmasi);
route.patch('/:id', updateFarmasi);
route.delete('/:id', deleteFarmasi);

module.exports = route;