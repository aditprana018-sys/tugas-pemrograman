const express = require('express');
const { savePemeriksaan } = require('./controller');

const route = express.Router();

route.post('', savePemeriksaan);

module.exports = route;