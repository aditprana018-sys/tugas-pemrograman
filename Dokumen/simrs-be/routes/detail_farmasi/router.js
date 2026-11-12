const express = require('express');
const {
  listDetailFarmasi,
  getDetailFarmasi,
  createDetailFarmasi,
  updateDetailFarmasi,
  deleteDetailFarmasi,
} = require('./controller');

const route = express.Router();

route.get('', listDetailFarmasi);
route.get('/:id', getDetailFarmasi);
route.post('', createDetailFarmasi);
route.put('/:id', updateDetailFarmasi);
route.patch('/:id', updateDetailFarmasi);
route.delete('/:id', deleteDetailFarmasi);

module.exports = route;