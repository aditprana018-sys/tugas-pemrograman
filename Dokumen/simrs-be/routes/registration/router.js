const express = require('express')
const {
  listRegistration,
  saveRegistration,
  updateRegistration,
  deleteRegistration,
} = require('./controller')
const route = express.Router()

route.get('', listRegistration)
route.post('', saveRegistration)
route.put('/:id', updateRegistration)
route.patch('/:id', updateRegistration)
route.delete('/:id', deleteRegistration)

module.exports = route