const express = require('express');
const {
  listPoli,
  getPoli,
  createPoli,
  updatePoli,
  deletePoli,
} = require('./controller');

const route = express.Router();

route.get('', listPoli);
route.get('/:id', getPoli);
route.post('', createPoli);
route.put('/:id', updatePoli);
route.patch('/:id', updatePoli);
route.delete('/:id', deletePoli);

module.exports = route;